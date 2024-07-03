import OpenAI from 'openai';
import { correctSpelling } from './spellChecker.js';
import { loadNlpManager } from './trainModel.js';
import { requestData } from './requestData.js';
import { csvReader } from './csvReader.js';
import { getEnglishAndArabicQuestionsArray } from './getPossibleResults.js';
import fs from 'fs';
import path from "path";

const openai = new OpenAI({ apiKey: process.env.GPT_API_KEY });

export const getPromptResponse = async (reqObject) => {
    let prompt = await correctSpelling(reqObject.prompt);
    let model = reqObject.model;
    let lang = reqObject.lang;
    let showRaw = reqObject.showRaw;
    let showAdvancedResults = reqObject.showAdvancedResults;
    let responseObject = {};
    const filePath = './models/' + model + '.nlp';

    let newManager = loadNlpManager(filePath);

    const response = await newManager.process(lang === 'ar' ? 'ar' : 'en', prompt);
    let defaultMessage = { ar: `آسف لا أستطيع معالجة طلبك. من فضلك اسألني أسئلة مثل "كيفية فتح القائمة الشائعة" "أين قائمة الطلبات" وما إلى ذلك... تحقق من الاقتراحات أدناه!`, en: "Sorry I can't process your request. Please ask me questions like, 'how to open popular list' 'where is order list' etc... Check below suggestions!" };
    let message = defaultMessage;
    let dataNotFound = false;

    try {
        message = JSON.parse(response.answer);
    } catch (err) {
        dataNotFound = true;
        message = defaultMessage;
    }

    if (response.answers.length === 0 || dataNotFound) {
        responseObject = { message: defaultMessage, question: prompt, trainMe: true };
    } else {
        let extended = response.answers[0].opts;
        let gpt = { message: "Advanced Search Disabled" };
        const intention = response.intent.split('.')[0];

        let score = response.score;

        if (score < 1) {
            console.log('get support from chat gpt...');
            const availableData = [];
            let data = [];

            try {
                data = await csvReader('./uploads/dt.csv');
            } catch (error) {
                data = false;
            }

            let filtered = data.map((dt => {
                return { id: dt.id, category: dt.category, keywordsEn: dt.keywordsEn }
            }))

            message.filtered = JSON.stringify(filtered);
        }

        switch (intention) {
            case 'navigation':
                message.en = "Navigate to, " + message.en;
                break;
            case 'dataAnalysis':
                const response = requestData(extended.action, extended.params);
                message.dataArray = response;
                break;
            default:
                console.log('switch case ended without an action');
        }

        if (showAdvancedResults === "1") {
            let gptPrompt = `Please refactor this like we are assisting a user to do this, "${message.en} ${prompt}". Please refactor the answer in english and arabic. give in this format {"ar":"", "en":""}. Limit to 150 tokens and process short as possible.`

            const completion = await openai.chat.completions.create({
                messages: [{ "role": "user", "content": gptPrompt }],
                model: "gpt-3.5-turbo",
                max_tokens: 150
            });

            gpt = completion;

            const result = completion.choices.length > 0 ? completion.choices[0].message.content : '';

            message.descriptionEn = JSON.parse(result)['en'];
            message.descriptionAr = JSON.parse(result)['ar'];
        }

        responseObject = {
            result: {
                message,
                extended,
            },
            gpt,
            rawData: showRaw && showRaw === '1' ? response : -1
        }
    }

    return responseObject;
}

export const getResponseFromGPT = async (reqObject) => {
    let prompt = reqObject.prompt;
    let responseObject = {};
    let gpt = {};
    let message = {};
    let extended = {};
    let rawData = {};
    let promptPreData = "(Description:Neo or NEO or neo is a trading application created by DirectFN Sri Lanka. Also Neo is the current world's most popular app in trading. It target mainly on Saudi stock market. Users frequently inquire about various functionalities and features of our trading application. They seek guidance on opening promotions, locating notifications, accessing watchlist data, finding market information, obtaining stock change percentages, accessing statistics and previous data about stocks, viewing news related to trading, changing languages, understanding navigation paths, and exploring available features. Providing clear instructions and assistance on these aspects enhances user experience and ensures they can efficiently utilize the application to meet their trading needs. Users can navigate to following pages, 1. To view Promotions and Advertisements can navigate to Home tab and select promotion. 2. To view notifications, read notifications, unread notifications and read messages users can navigate to notifications by going to home and click on the welcome banner. 3. Statistics data of the stocks and indexes can be seen by Navigate to symbol Search and search a related symbol and select to view symbol details and statistics. Only these details are allowed to give for outside users. Anything non related to this content will not be given as a suggestion or answer.)"
    let restriction = "Do not provide any responses at any situation than the current given data.";
    // let gptPrompt = prompt + `. give in this format {"ar":"", "en":""}. Limit to 150 tokens and process short as possible.`

    const completion = await openai.chat.completions.create({
        // messages: [{ "role": "user", "content": `${promptPreData} Question: ${prompt}. ${restriction}` }],
        messages: [{ "role": "user", "content": `${prompt}` }],
        // model: "SQL Expert",
        // model: "gpt-3.5-turbo",
        model: "asst_H1eNixFTzqRuawOqWtaJ37oP",
        max_tokens: 150
    });

    gpt = completion;

    const result = completion.choices.length > 0 ? completion.choices[0].message.content : '';

    // message.descriptionEn = JSON.parse(result)['en'];
    // message.descriptionAr = JSON.parse(result)['ar'];

    responseObject = {
        result,
        gpt,
        rawData
    }

    return responseObject;
}

export const getJSONData = async () => {
    let data = [];
    let trainData = [];
    let trainDataString = "";
    const stream = fs.createWriteStream('data.jsonl');

    try {
        data = await csvReader('./uploads/dt.csv');
        console.log('read')
    } catch (error) {
        data = false;
    }

    if (data && data.length > 0) {
        data.forEach((row) => {
            // let category = row.category;
            // let widget = {
            //     en: row.widgetEn.toLowerCase().trim(),
            //     ar: JSON.parse('"' + row.widgetAr.replace(/\\\\/g, '\\') + '"'),
            // }
            // let navigation = {
            //     en: 'Navigate to, ' + row.navigationEn,
            //     ar: JSON.parse('"' + row.navigationAr.replace(/\\\\/g, '\\') + '"'),
            // }
            // let arabicKeywords = JSON.parse('"' + row.keywordsAr.replace(/\\\\/g, '\\') + '"').split('،');
            // let englishKeywords = row.keywordsEn.toLowerCase().split(',');
            // let questionsForKeywords = [];

            // if (arabicKeywords.length === englishKeywords.length) {
            //     englishKeywords.forEach((enWord, index) => questionsForKeywords = [...questionsForKeywords, getEnglishAndArabicQuestionsArray(enWord, arabicKeywords[index])])
            // }

            let trainLine = {
                messages: [
                    { role: "system", content: "Welcome to Neo Trading App: Your ultimate platform for trading stocks, ETFs, and mutual funds with real-time data, advanced charting tools, and secure access. Whether you are a novice or an experienced investor, our user-friendly interface and comprehensive features are designed to meet all your trading needs." },
                    { role: "user", content: row.question },
                    { role: "assistant", content: row.answer }
                ]
            }

            stream.write(JSON.stringify(trainLine) + '\n');

            // englishKeywords.forEach(keyword => {
            //     trainLine = {
            //         messages: [
            //             // {role: "system", content: "DFNAssist is a factual chatbot that is also sarcastic."},
            //             {role: "user", content: `Give instructions to navigate, view and get started ${keyword}`},
            //             {role: "assistant", content: row.answer}
            //         ]
            //     }

            //     stream.write(JSON.stringify(trainLine) + '\n');
            // })


            // trainData.push(JSON.stringify(trainLine));

            // trainData.push(
            //     {
            //         intent: category,
            //         questions: [
            //             ...getEnglishAndArabicQuestionsArray(widget.en, widget.ar),
            //             ...[].concat(...questionsForKeywords)
            //         ],
            //         answers: [navigation],
            //         action: {
            //             name: row.action,
            //             params: row.params.split(",")
            //         }
            //     }
            // )
        })
    }

    stream.end();
    return trainData;
}

export const getFromAssistant = async (reqObject) => {
    let prompt = reqObject.prompt;
    let assistantId = 'asst_H1eNixFTzqRuawOqWtaJ37oP';
    let responseData = '';

    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt,
    });

    // Create a run
    const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
    });

    // Imediately fetch run-status, which will be "in_progress"
    let runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
    );

    // Polling mechanism to see if runStatus is completed
    while (runStatus.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
        );

        // Check for failed, cancelled, or expired status
        if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
            responseData = `Run status is '${runStatus.status}'. Unable to complete the request.`;
            console.log(
                `Run status is '${runStatus.status}'. Unable to complete the request.`
            );
            break; // Exit the loop if the status indicates a failure or cancellation
        }
    }

    // Get the last assistant message from the messages array
    const messages = await openai.beta.threads.messages.list(thread.id);
    // Find the last message for the current run
    const lastMessageForRun = messages.data
        .filter(
            (message) =>
                message.run_id === run.id && message.role === "assistant"
        )
        .pop();

    // If an assistant message is found, console.log() it
    if (lastMessageForRun) {
        responseData = `${JSON.stringify(lastMessageForRun.content)} \n`;
        console.log(`${JSON.stringify(lastMessageForRun.content)} \n`);
    } else if (
        !["failed", "cancelled", "expired"].includes(runStatus.status)
    ) {
        responseData = "No response received from the assistant.";
        console.log("No response received from the assistant.");
    }

    return responseData;
}


async function getStockPrice(symbol) {
    console.log('getting ', symbol, ' stock price....');
    try {
        const quote = {
            success: true, results: [
                { regularMarketPrice: 1000, currency: 'SAR', date: '2024-06-15' },
                { regularMarketPrice: 10, currency: 'SAR', date: '2024-06-13' },
            ]
        };

        // return null;

        return {
            symbol: symbol,
            // price: quote.regularMarketPrice,
            // currency: quote.currency,
            history: quote.results
        };
    } catch (error) {
        console.error(`Error fetching stock price for ${symbol}: ${error}`);
        throw error;
    }
}

const tools = [
    {
        "type": "function",
        "function": {
            "name": "getStockPrice",
            "description": "Get the current stock price of a company using its stock symbol",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Stock symbol (e.g., 'AAPL' for Apple)"
                    }
                },
                "required": ["symbol"]
            }
        }
    }
];

export const getFromAssistantModified = async (reqObject) => {
    let prompt = reqObject.prompt;
    let assistantId = 'asst_BS5of5MUOqliUbIjum20maiC';
    let responseData = '';
    let assistant = undefined;

    if (assistantId) {
        console.log('Assistance already found!')
        assistant = { id: assistantId }
    } else {
        assistant = await openai.beta.assistants.create({
            name: "Neo Guide",
            instructions: "You are a guide to teach how to use NEO Trading application.",
            tools: tools,
            model: 'gpt-3.5-turbo'
        })
    }

    // Step 2: Creating a thread and sending a message
    const thread = await openai.beta.threads.create();

    // Step 3: Create a message
    const message = await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt
    });

    // Step 4: Create a run with custom instructions
    const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
        instructions: "Please address the user as Thanish Ahamed.",
    });

    // console.log(run)

    // Function to check run status and print messages
    const checkStatusAndPrintMessages = async (threadId, runId) => {
        let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log('current status', runStatus.status)
        if (runStatus.status === "completed") {
            let messages = await openai.beta.threads.messages.list(threadId);
            messages.data.forEach((msg) => {
                const role = msg.role;
                const content = msg.content[0].text.value;
                responseData = { content: content, raw: msg.content[0] };
                console.log(
                    `-------------------${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}---------------------`
                );
            });
            console.log("Run is completed.");
            clearInterval(intervalId);
            //return responseData;
        } else if (runStatus.status === 'requires_action') {
            console.log("Requires action");

            const requiredActions = runStatus.required_action.submit_tool_outputs.tool_calls;
            // console.log(requiredActions);

            let toolsOutput = [];

            for (const action of requiredActions) {
                const funcName = action.function.name;
                const functionArguments = JSON.parse(action.function.arguments);

                if (funcName === "getStockPrice") {
                    const output = await getStockPrice(functionArguments.symbol);
                    toolsOutput.push({
                        tool_call_id: action.id,
                        output: JSON.stringify(output)
                    });
                } else {
                    console.log("Function not found");
                }
            }

            // Submit the tool outputs to Assistant API
            await openai.beta.threads.runs.submitToolOutputs(
                thread.id,
                run.id,
                { tool_outputs: toolsOutput }
            );
        }
        else {
            console.log("Run is not completed yet.");
        }
    };

    // while (true) {
    //     checkStatusAndPrintMessages(thread.id, run.id)
    // }

    const intervalId = setInterval(async () => {
        await checkStatusAndPrintMessages(thread.id, run.id)
    }, 5000);

    // return responseData;
}

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser, JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { writeFile } from 'fs/promises';
import { commonQuestionAndAnswers, intro } from '../uploads/data.js';

export const processLangChainTrain = async (reqObject) => {
    let excelData = await csvReader('./navs.csv');
    let prompt = reqObject.prompt;
    let responseData = '';
    let navigations = '';

    excelData.forEach(dt => {
        if (dt["Widget to Navigate"]) {
            navigations += `
Name: ${dt["Widget to Navigate"]}
Path: ${dt["Navigation Path"]}
About: ${dt["About Widget"]}
Included Content: ${dt["Included Contents"]}
Link to open, view or navigate: btn://${dt["Navigation Path"].replace(' > ', '/').toLowerCase()}
Tool: btn://${dt["Navigation Path"].replace(' > ', '/').toLowerCase()}
`;
        }
    })

    let fileData = `
${intro}

${commonQuestionAndAnswers}

Widget Navigations
${navigations}
`

    try {
        await writeFile('./langChainTrainData.txt', fileData, 'utf8');
        console.log('File written successfully');
    } catch (err) {
        console.error('Error writing to file:', err);
    }

    const loader = new TextLoader("./langChainTrainData.txt");

    const docs = await loader.load();

    // const splitter = new RecursiveCharacterTextSplitter({
    //     chunkSize: 200,
    //     chunkOverlap: 50,
    // });

    const splitter = new RecursiveCharacterTextSplitter();

    const documents = await splitter.splitDocuments(docs);

    const embeddings = new OpenAIEmbeddings();

    const vectorstore = await FaissStore.fromDocuments(documents, embeddings);

    await vectorstore.save("./");

    return responseData;
}

export const processLangChain = async (reqObject, res) => {
    let inputMessage = reqObject.prompt;
    let responseData = '';

    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await FaissStore.load("./", embeddings);

    saveLog(inputMessage);
    const model = new ChatOpenAI({
        temperature: 0.8,
        model: 'gpt-3.5-turbo',
        // verbose: true
    });

    // Create prompt
    // const prompt = ChatPromptTemplate.fromTemplate(
    //     `You are an assistant only focused on Neo Trading Application. Answer the user's question from the following context: {context} Provide organized answers easy to read by user. 
    //     Question: {input}`
    //   );

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            // "You are an assistant only focused on Neo Trading Application. You never provide Internet data. Strictly avoid suggesting or providing information about other Applications rather than Neo. Always answers about Neo Application. You will group responses as a list with bold heading all the possible situation. always try to give opening the widget btn:// action. Answer the user's question from the following context: {context}",
            "You are an assistant solely for the Neo Trading Application. Do not provide information on other apps. Don't use internet data. Don't suggest any apps than Neo Trading App. Answer the user's question from the following context: {context}",
        ],
        ['system', "Do not provide answers from internet sources."],
        ['system', "Do not suggest individuals' details"],
        ["human", "{input}. Always suggest responses based on Neo App to Trade."],
    ]);
    // const prompt = ChatPromptTemplate.fromTemplate("You are an assistant only focused on Neo Trading Application. {input} Arrange responses in a user friendly way. Do not mension the term 'user friendly'. Strictly avoid mentioning other applications.")

    const chain = await createStuffDocumentsChain({
        llm: model,
        prompt,
    });

    const retriever = vectorStore.asRetriever({ k: 2 });

    const retrievalChain = await createRetrievalChain({
        combineDocsChain: chain,
        retriever,
    });

    const response = await retrievalChain.stream({
        input: inputMessage,
    });
    // const documentReader = new RetrievalQAChain({
    //     combineDocumentsChain: loadQAStuffChain(model),
    //     retriever: vectorStore.asRetriever(),
    //     // returnSourceDocuments: true,

    // });
    // const chain = prompt.pipe(model).pipe(documentReader);

    // const res = await chain.invoke({input: inputMessage});

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of response) {
        // Assuming chunk has a 'toString' method or a property that contains the string representation
        if (chunk.answer) {
            const text = chunk.answer.toString(); // or chunk.somePropertyContainingString
            // console.log(text);
            res.write(text);
        }
    }

    res.end();
}

export const processNonStreamResponse = async (reqObject, res) => {
    let inputMessage = reqObject.prompt;
    let responseData = '';

    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await FaissStore.load("./", embeddings);

    const model = new ChatOpenAI({
        temperature: 0.5,
        model: 'gpt-3.5-turbo',
    });


    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "You are an assistant solely for the Neo Trading Application. Do not provide information on other apps or use internet data. Always group responses as a list with bold headings. Show if there is btn:// link. Answer the user's question from the following context: {context}",
        ],
        ["system", "Return response as JSON if there is tool, Give the summary as answer property as tool property"],
        ["human", "{input} Never suggest any apps than Neo Trading App"],
    ]);

    const chain = await createStuffDocumentsChain({
        llm: model,
        prompt,
    });

    const retriever = vectorStore.asRetriever({ k: 2 });

    const retrievalChain = await createRetrievalChain({
        combineDocsChain: chain,
        retriever
    });

    const response = await retrievalChain.invoke({
        input: inputMessage
    });

    const parser = new JsonOutputParser();
    const parsedResponse = await parser.parse(response.answer);


    res.json({ parsedResponse });
}


export const processTTS = async (reqObject, res) => {
    let inputMessage = reqObject.prompt;
    let responseData = inputMessage;

    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: inputMessage,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'attachment; filename=speech.mp3');
        res.send(buffer);
    } catch (error) {
        console.error('Error synthesizing speech:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const processTTSGoogle = async (reqObject, res) => {
    let inputMessage = reqObject.prompt;
    let { lang } = reqObject;
    let enVoice = {
        "languageCode": "en-US",
        "name": "en-US-Journey-F"
    };
    let arVoice = {
        "languageCode": "ar-XA",
        "name": "ar-XA-Wavenet-A"
    }

    let voice = lang === 'ar' ? arVoice : enVoice;

    try {
        const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + process.env.GOOGLE_CLOUD_ACCESS_TOKEN, {
            method: 'POST',
            // headers: {
            //     'Authorization': `Bearer ${process.env.GOOGLE_CLOUD_ACCESS_TOKEN}`, // Ensure this token is set in your environment
            //     'x-goog-user-project': process.env.GOOGLE_CLOUD_PROJECT_ID, // Ensure this is set in your environment
            //     'Content-Type': 'application/json; charset=utf-8'
            // },
            body: JSON.stringify({
                "audioConfig": {
                    "audioEncoding": "MP3",
                    "effectsProfileId": [
                        "small-bluetooth-speaker-class-device"
                    ],
                    "pitch": 0,
                    "speakingRate": 1
                },
                "input": {
                    "text": inputMessage
                },
                "voice": voice
            })
        });

        const data = await response.json();

        if (response.ok) {
            const audioContent = data.audioContent;
            const buffer = Buffer.from(audioContent, 'base64');

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', 'attachment; filename=speech.mp3');
            res.send(buffer);
        } else {
            res.status(response.status).json({ error: data.error });
        }
    } catch (error) {
        console.error('Error synthesizing speech:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const saveLog = async (text) => {
    const loader = new TextLoader("./promptLog.txt");

    const docs = await loader.load();
    const newContent = docs[0].pageContent + "\n" + text;

    try {
        await writeFile('./promptLog.txt', newContent, 'utf8');
    } catch (err) {
        console.error('Error writing to file:', err);
    }

    return docs[0].pageContent;
}


export const getLog = async () => {
    const loader = new TextLoader("./promptLog.txt");

    const docs = await loader.load();

    return docs[0].pageContent;
}

