const { NlpManager } = require("node-nlp");
const fs = require('fs');

const csvReader = require("./csvReader");
const { getEnglishAndArabicQuestionsArray } = require("./getPossibleResults");

const loadNlpManager = (filePath) => {
    const manager = new NlpManager({ languages: ['en', 'ar'], forceNER: true });
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        manager.import(JSON.parse(data));
    }
    return manager;
};

const saveNlpManager = (manager, filePath) => {
    const data = manager.export();
    fs.writeFileSync(filePath, data);
};

const trainMenuSearchModel = async (reqObject) => {
    let data = [];
    let trainData = [];
    const bodyContent = JSON.parse(JSON.stringify(reqObject))
    const model = bodyContent.model;
    const filePath = './models/' + model + '.nlp';
    const manager = loadNlpManager(filePath);
    // const manager = new NlpManager({ languages: ['en', 'ar'], forceNER: true });
    const isUntrainMode = reqObject.isUntrainMode === '1';

    try {
        data = await csvReader('./uploads/dt.csv');
    } catch (error) {
        data = false;
    }

    if (data && data.length > 0) {
        data.forEach((row) => {
            let category = row.category;
            let widget = {
                en: row.widgetEn.toLowerCase().trim(),
                ar: JSON.parse('"' + row.widgetAr.replace(/\\\\/g, '\\') + '"'),
            }
            let navigation = {
                en: row.navigationEn,
                ar: JSON.parse('"' + row.navigationAr.replace(/\\\\/g, '\\') + '"'),
            }
            let arabicKeywords = JSON.parse('"' + row.keywordsAr.replace(/\\\\/g, '\\') + '"').split('،');
            let englishKeywords = row.keywordsEn.toLowerCase().split(',');
            let questionsForKeywords = [];

            if (arabicKeywords.length === englishKeywords.length) {
                englishKeywords.forEach((enWord, index) => questionsForKeywords = [...questionsForKeywords, getEnglishAndArabicQuestionsArray(enWord, arabicKeywords[index])])
            }

            trainData.push(
                {
                    intent: category,
                    questions: [
                        ...getEnglishAndArabicQuestionsArray(widget.en, widget.ar),
                        ...[].concat(...questionsForKeywords)
                    ],
                    answers: [navigation],
                    action: {
                        name: row.action,
                        params: row.params.split(",")
                    }
                }
            )
        })
    }

    trainData.forEach((dt) => {
        let answerConfigs = undefined;

        if (dt.action) {
            answerConfigs = { action: dt.action.name, params: dt.action.params }
        }

        dt.questions.forEach(async (que) => {
            if (isUntrainMode) {
                await manager.removeDocument('en', que.en, dt.intent);
                await manager.removeDocument('ar', que.ar, dt.intent);
            } else {
                await manager.addDocument('en', que.en, dt.intent);
                await manager.addDocument('ar', que.ar, dt.intent);
            }
            
        });

        dt.answers.forEach(async (ans) => {
            if (isUntrainMode) {
                await manager.removeAnswer('en', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
                await manager.removeAnswer('ar', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
            } else {
                await manager.addAnswer('en', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
                await manager.addAnswer('ar', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
            }
        });
    })

    await manager.train();
    saveNlpManager(manager, filePath);
    // manager.save('./models/' + model + '.nlp');

    return trainData;
}

const trainModel = async (reqObject) => {
    const bodyContent = reqObject;
    const model = bodyContent.model;
    const trainData = bodyContent.trainData;
    const filePath = './models/' + model + '.nlp';
    const manager = loadNlpManager(filePath);
    // const manager = new NlpManager({ languages: ['en', 'ar'], forceNER: true });
    const isUntrainMode = reqObject.isUntrainMode === '1';

    trainData.forEach((dt) => {
        let answerConfigs = undefined;

        if (dt.action) {
            answerConfigs = { action: dt.action.name, params: dt.action.params }
        }

        dt.questions.forEach((que) => {
            if (isUntrainMode) {
                manager.removeDocument('en', que.en, dt.intent);
                manager.removeDocument('ar', que.ar, dt.intent);
            } else {
                manager.addDocument('en', que.en, dt.intent);
                manager.addDocument('ar', que.ar, dt.intent);
                
            }
        });

        dt.answers.forEach((ans) => {
            if (isUntrainMode) {
                manager.removeAnswer('en', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
                manager.removeAnswer('ar', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
            } else {
                manager.addAnswer('en', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
                manager.addAnswer('ar', dt.intent, `{"en": \"${ans.en}\", "ar": \"${ans.ar}\"}`, answerConfigs);
            }
        });
    })

    await manager.train();
    // manager.save('./models/' + model + '.nlp');
    saveNlpManager(manager, filePath);

    return bodyContent;
}
module.exports = {
    trainMenuSearchModel,
    trainModel,
    loadNlpManager
};