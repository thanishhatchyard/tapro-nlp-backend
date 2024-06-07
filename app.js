const express = require('express')
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
// const { NlpManager } = require('node-nlp');
// const OpenAI = require("openai");
// const csvReader = require('./controls/csvReader');
const server = require('http').createServer(app);

app.use(cors());

app.use(bodyParser.json());

app.get('/', (req, res) => {
    return res.json('Welcome to Tapro NLP');
})

// app.post('/train', async (req, res) => {
//     const bodyContent = JSON.parse(JSON.stringify(req.body))
//     const model = bodyContent.model;
//     const trainData = Object.values(bodyContent.trainData);
//     const manager = new NlpManager({ languages: ['en', 'ar'], forceNER: true });

//     trainData.forEach((dt) => {
//         let answerConfigs = undefined;

//         if (dt.action) {
//             answerConfigs = { action: dt.action.name, params: dt.action.params }
//         }

//         dt.questions.forEach(async (que) => {
//             await manager.addDocument('en', que.en, dt.intent);
//             await manager.addDocument('ar', que.ar, dt.intent);
//         });

//         dt.answers.forEach(async (ans) => {
//             await manager.addAnswer('en', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
//             await manager.addAnswer('ar', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
//         });
//     })

//     await manager.train();
//     manager.save('./models/' + model + '.nlp');

//     res.json({ message: "Training Complete!", ...trainData });
// })

// app.post('/untrain', async (req, res) => {
//     const bodyContent = JSON.parse(JSON.stringify(req.body))
//     const model = bodyContent.model;
//     const trainData = Object.values(bodyContent.trainData);
//     const manager = new NlpManager({ languages: ['en', 'ar'], forceNER: true });

//     trainData.forEach(dt => {
//         dt.questions.forEach(que => {
//             manager.removeDocument('en', que.en, dt.intent);
//             manager.removeDocument('ar', que.ar, dt.intent);
//         });

//         dt.answers.forEach(ans => {
//             manager.removeAnswer('en', dt.intent, ans.en);
//             manager.removeAnswer('ar', dt.intent, ans.ar)
//         });
//     })

//     await manager.train();
//     manager.save('./models/' + model + '.nlp');

//     res.json({ message: "Processed!", ...trainData });
// })

// app.get('/prompt', async (req, res) => {
// // app.post('/prompt', async (req, res) => {
//     let prompt = req.query.prompt;
//     let model = req.query.model;
//     let lang = req.query.lang;
//     let showRaw = req.query.showRaw;
    
//     let newManager = new NlpManager();
//     newManager.load('./models/' + model + '.nlp');

//     const response = await newManager.process(lang === 'ar' ? 'ar' : 'en', prompt);
//     let defaultMessage = { ar: `آسف لا أستطيع معالجة طلبك. من فضلك اسألني أسئلة مثل "كيفية فتح القائمة الشائعة" "أين قائمة الطلبات" وما إلى ذلك... تحقق من الاقتراحات أدناه!`, en: "Sorry I can't process your request. Please ask me questions like, 'how to open popular list' 'where is order list' etc... Check below suggestions!" };
//     let message = defaultMessage;
//     let dataNotFound = false;

//     try { 
//         message = JSON.parse(response.answer);
//     } catch (err) {
//         dataNotFound = true;
//         message = defaultMessage;
//     }

//     if (response.answers.length === 0 || dataNotFound) {
//         return res.json({ message: defaultMessage, question: prompt, trainMe: true })
//     } else {
//         let extended = response.answers[0].opts;

//         return res.json({
//             result: {
//                 message,
//                 extended,
//             },
//             rawData: showRaw && showRaw === '1' ? response : -1
//         })
//     }
// })

// // const openai = new OpenAI({ apiKey: "" });


// const getEnglishAndArabicQuestionsArray = (english, arabic) => {
//     return [
//         {
//             "en": `navigate to ${english}`,
//             "ar": `${arabic} انتقل إلى`
//         }
//         ,
//         {
//             "en": `go to ${english}`,
//             "ar": `انتقل إلى ${arabic}`
//         },
//         {
//             "en": `show me how to use ${english}`,
//             "ar": `أرني كيفية استخدام ${arabic}`
//         },
//         {
//             "en": `How do I use ${english}?`,
//             "ar": `كيف أستخدم ${arabic}؟`
//         },
//         {
//             "en": `Can you explain how to use ${english}?`,
//             "ar": `هل يمكنك شرح كيفية استخدام ${arabic}؟`
//         },
//         {
//             "en": `What is the process to use ${english}?`,
//             "ar": `ما هو العملية لاستخدام ${arabic}؟`
//         },
//         {
//             "en": `Give me a tutorial on how to use ${english}.`,
//             "ar": `أعطني دروسًا تعليمية حول كيفية استخدام ${arabic}.`
//         },
//         {
//             "en": `Provide a guide for using ${english}.`,
//             "ar": `قدم دليل لاستخدام ${arabic}.`
//         },
//         {
//             "en": `How can I utilize ${english}?`,
//             "ar": `كيف يمكنني الاستفادة من ${arabic}؟`
//         },
//         {
//             "en": `Steps to use ${english}.`,
//             "ar": `الخطوات لاستخدام ${arabic}.`
//         },
//         {
//             "en": `How to get started with ${english}?`,
//             "ar": `كيفية البدء مع ${english}؟`
//         },
//         {
//             "en": `Instructions to use ${english}.`,
//             "ar": `تعليمات لاستخدام ${arabic}.`
//         },
//         {
//             "en": `Demonstrate how to use ${english}.`,
//             "ar": `قدم كيفية استخدام ${arabic}.`
//         },
//         {
//             "en": `where is ${english}`,
//             "ar": `أين ${arabic}`
//         },
//         {
//             "en": `how to open ${english}`,
//             "ar": `كيفية فتح ${arabic}`
//         },
//         {
//             "en": `show me how to use ${english}`,
//             "ar": `أرني كيفية استخدام ${arabic}`
//         },
//         {
//             "en": `where is ${english}`,
//             "ar": `أين ${arabic}`
//         },
//         {
//             "en": `show me how to use ${english}`,
//             "ar": `أرني كيفية استخدام ${arabic}`
//         },
//         {
//             "en": `how to open ${english}`,
//             "ar": `كيفية فتح ${arabic}`
//         },
//         {
//             "en": `how to ${english}`,
//             "ar": `كيف ${arabic}`
//         },
//         {
//             "en": `${english}`,
//             "ar": `${arabic}`
//         }
//     ]
// }
 
// app.post('/trainWidgetSearch', async (req, res) => {
//     let data = [];
//     let trainData = [];
//     const bodyContent = JSON.parse(JSON.stringify(req.body))
//     const model = bodyContent.model;
//     const manager = new NlpManager({ languages: ['en', 'ar'], forceNER: true });

//     try {
//         data = await csvReader('./dt.csv');
//     } catch (error) {
//         data = false;
//     }

//     if (data && data.length > 0) {
//         data.forEach((row) => {
//             let category = row.category;
//             let widget = {
//                 en: row.widgetEn.toLowerCase().trim(),
//                 ar: JSON.parse('"' + row.widgetAr.replace(/\\\\/g, '\\') + '"'),
//             }
//             let navigation = {
//                 en: row.navigationEn,
//                 ar: JSON.parse('"' + row.navigationAr.replace(/\\\\/g, '\\') + '"'),
//             }
//             let arabicKeywords = JSON.parse('"' + row.keywordsAr.replace(/\\\\/g, '\\') + '"').split('،');
//             let englishKeywords = row.keywordsEn.toLowerCase().split(',');
//             let questionsForKeywords = [];

//             if (arabicKeywords.length === englishKeywords.length) {
//                 englishKeywords.forEach((enWord, index) => questionsForKeywords = [...questionsForKeywords, getEnglishAndArabicQuestionsArray(enWord, arabicKeywords[index])])
//             }

//             trainData.push(
//                 {
//                     intent: category,
//                     questions: [
//                         ...getEnglishAndArabicQuestionsArray(widget.en, widget.ar),
//                         ...[].concat(...questionsForKeywords)
//                     ],
//                     answers: [navigation],
//                     action: {
//                         name: row.action,
//                         params: row.params.split(",")
//                     }
//                 }
//             )
//         })
//     }

//     trainData.forEach((dt) => {
//         let answerConfigs = undefined;

//         if (dt.action) {
//             answerConfigs = { action: dt.action.name, params: dt.action.params }
//         }

//         dt.questions.forEach(async (que) => {
//             await manager.addDocument('en', que.en, dt.intent);
//             await manager.addDocument('ar', que.ar, dt.intent);
//         });

//         dt.answers.forEach(async (ans) => {
//             await manager.addAnswer('en', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
//             await manager.addAnswer('ar', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
//         });
//     })

//     await manager.train();
//     manager.save('./models/' + model + '.nlp');

//     return res.json({ message: "Training Complete!", ...trainData });
// });

let port = process.env.port || 3000;
server.listen(port, function () {
    console.log(`Listening on port ${port}`);
  });