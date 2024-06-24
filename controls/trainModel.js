import { NlpManager } from 'node-nlp';
import fs from 'fs';
import { csvReader } from './csvReader.js';
import { getEnglishAndArabicQuestionsArray } from './getPossibleResults.js';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

export const loadNlpManager = (filePath) => {
    const manager = new NlpManager({ languages: ['en', 'ar'], forceNER: true });
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        manager.import(JSON.parse(data));
    }
    return manager;
};

export const saveNlpManager = (manager, filePath) => {
    const data = manager.export();
    fs.writeFileSync(filePath, data);
};

export const trainMenuSearchModel = async (reqObject) => {
    let data = [];
    let trainData = [];
    const bodyContent = JSON.parse(JSON.stringify(reqObject))
    const model = bodyContent.model;
    const filePath = './models/' + model + '.nlp';
    const manager = loadNlpManager(filePath);
    const isUntrainMode = reqObject.isUntrainMode === '1';

    try {
        data = await csvReader('./uploads/dt.csv');
        console.log('read')
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

    return trainData;
}

export const trainModel = async (reqObject) => {
    const bodyContent = reqObject;
    const model = bodyContent.model;
    const trainData = bodyContent.trainData;
    const filePath = './models/' + model + '.nlp';
    const manager = loadNlpManager(filePath);
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
    saveNlpManager(manager, filePath);

    return bodyContent;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.GPT_API_KEY;
const TRAINING_FILE_PATH = path.join(__dirname, '../data.jsonl');

export const trainGPT = async () => {
    const form = new FormData();
    form.append('purpose', 'fine-tune');
    form.append('file', fs.createReadStream(TRAINING_FILE_PATH));

    try {
        const response = await axios.post('https://api.openai.com/v1/files', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });
        console.log('File uploaded:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error uploading file:', error.response ? error.response.data : error.message);
        throw error;
    }
}

export const updateFineTuneModel = async () => {
    const trainingFileId = 'file-X2oj9EvJsAXj0NbrtmWoe4M2';
    const fineTuneId = 'ft:gpt-3.5-turbo-0125:personal::9YpZ80FO';

    try {
      const response = await axios.post(`https://api.openai.com/v1/fine_tuning/jobs`, {
        training_file: trainingFileId,
        model: fineTuneId,
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Fine-tune update job created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating fine-tune update job:', error.response ? error.response.data : error.message);
      throw error;
    }
  }