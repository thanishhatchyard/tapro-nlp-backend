const { NlpManager } = require("node-nlp");
const { default: OpenAI } = require("openai");
const { correctSpelling } = require("./spellChecker");
const { loadNlpManager } = require("./trainModel");

const openai = new OpenAI({ apiKey: process.env.GPT_API_KEY });

const getPromptResponse = async (reqObject) => {
    let prompt = correctSpelling(reqObject.prompt);
    let model = reqObject.model;
    let lang = reqObject.lang;
    let showRaw = reqObject.showRaw;
    let showAdvancedResults = reqObject.showAdvancedResults;
    let responseObject = {};
    const filePath = './models/' + model + '.nlp';

    let newManager = loadNlpManager(filePath);
    // newManager.load('./models/' + model + '.nlp');

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

    console.log(prompt)
    if (response.answers.length === 0 || dataNotFound) {
        responseObject = { message: defaultMessage, question: prompt, trainMe: true };
    } else {
        let extended = response.answers[0].opts;
        let gpt = {message: "Advanced Search Disabled"};

        if (response.intent.split('.')[0] === 'navigation') {
            message.en = "Navigate to, " + message.en;
        }

        if (showAdvancedResults === "1") {
            let gptPrompt = `Please refactor this like we are assisting a user to do this, "${message.en} ${prompt}". Please refactor the answer in english and arabic. give in this format {"ar":"", "en":""}. Limit to 150 tokens and process short as possible.`

            const completion = await openai.chat.completions.create({
                messages: [
                    // { "role": "system", "content": "You are a helpful assistant who refactor answers." },
                    { "role": "user", "content": gptPrompt },
                ],
                model: "gpt-3.5-turbo",
                max_tokens: 150
            });
    
            gpt = completion;

            const result = completion.choices.length > 0 ? completion.choices[0].message.content : '';

            // message.description = result;
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

module.exports = {
    getPromptResponse
}