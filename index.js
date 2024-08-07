import 'dotenv/config';
import express from "express";
import cors from 'cors'
import { trainGPT, trainMenuSearchModel, trainModel, updateFineTuneModel } from "./controls/trainModel.js";
import { getFromAssistant, getFromAssistantModified, getJSONData, getLog, getPromptResponse, getResponseFromGPT, processLangChain, processLangChainTrain, processNonStreamResponse, processTTS, processTTSGoogle, saveLog } from "./controls/processPrompts.js";
import { processSuggestion } from './controls/processSuggestions.js';

const app = express();

app.use(cors())
app.use(express.json())
let PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
    res.send("Hello from Express!");
});

app.post('/train', async (req, res) => {
    let response;

    console.log('runnin')
    try {
        response = await trainModel(req.body);
    } catch (error) {
        response = error.toString();
    }

    return res.json({ message: "Training Complete!", response });
})

app.post('/trainWidgetSearch', async (req, res) => {
    let response;

    try {
        response = await trainMenuSearchModel(req.body);
    } catch (error) {
        response = error.toString();
    }

    return res.json({ message: "Training Complete!", response });
});

app.post('/prompt', async (req, res) => {
    let response;

    try {
        response = await getPromptResponse(req.body);
    } catch (error) {
        response = error.toString();
    }

    return res.json({ message: "Processing Complete!", response });
})

app.post('/promptGPT', async (req, res) => {
    let response;

    try {
        response = await getResponseFromGPT(req.body);
    } catch (error) {
        response = error.toString();
    }

    return res.json({ message: "Processing Complete!", response });
})


app.post('/getJSONData', async (req, res) => {
    let response;

    try {
        response = await getJSONData();
    } catch (error) {
        response = error.toString();
    }

    return res.json({ message: "Processing Complete!", response });
})

app.post('/trainGPT', async (req, res) => {
    let response;

    try {
        // response = await trainGPT();
    } catch (error) {
        // response = error.toString();
    }

    return res.json({ message: "Processing Complete!", response });
})

app.post('/updateFineTuneModelGPT', async (req, res) => {
    let response;

    try {
        response = await updateFineTuneModel();
    } catch (error) {
        response = error.toString();
    }

    return res.json({ message: "Processing Complete!", response });
})


app.post('/getFromAssistant', async (req, res) => {
    let response;

    try {
        response = await getFromAssistant(req.body);
    } catch (error) {
        response = error.toString();
    }

    return res.json({ message: "Processing Complete!", response });
})

app.post('/getFromAssistantModified', async (req, res) => {
    let response;

    try {
        response = await getFromAssistantModified(req.body);
    } catch (error) {
        response = error.toString();
    } finally {
        return res.json({ message: "Processing Complete!", response });
    }
})


app.post('/ask', async (req, res) => {
    let response;

    try {
        response = await processLangChain(req.body, res);
    } catch (error) {
        response = error.toString();
        return res.json({ message: "Processing Complete!", response });
    }
});

app.post('/langChainTrain', async (req, res) => {
    let response;

    try {
        response = await processLangChainTrain(req.body);
    } catch (error) {
        response = error.toString();
    } finally {
        return res.json({ message: "Processing Complete!", response });
    }
});

app.post('/suggestion', async (req, res) => {
    let response;

    try {
        response = await processSuggestion(req.body);
    } catch (error) {
        response = error.toString();
    } finally {
        return res.json({ message: "Processing Complete!", response });
    }
});

app.post('/retriew', async (req, res) => {
    let response;

    try {
        response = await processNonStreamResponse(req.body, res);
    } catch (error) {
        response = error.toString();
        return res.json({ message: "Processing Complete!", response });
    }
});

app.post('/tts', async (req, res) => {
    let response;

    try {
        response = await processTTS(req.body, res);
    } catch (error) {
        response = error.toString();
        return res.json({ message: "Processing Complete!", response });
    }
})

app.post('/tts-google', async (req, res) => {
    let response;

    try {
        response = await processTTSGoogle(req.body, res);
    } catch (error) {
        response = error.toString();
        return res.json({ message: "Processing Complete!", response });
    }
})

app.post('/save-log', async (req, res) => {
    let response;

    try {
        response = await saveLog(req.body.prompt);
    } catch (error) {
        response = error.toString();
        return res.json({ message: "Processing Complete!", response });
    } finally {
        return res.json({ message: "Processing Complete!", response });
    }
})

app.post('/get-log', async (req, res) => {
    let response;

    try {
        response = await getLog();
    } catch (error) {
        response = error.toString();
        return res.json({ message: "Processing Complete!", response });
    } finally {
        response = response ? response : 'log empty!';
        return res.json({ message: "Processing Complete!", response });
    }
})

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}/`);
});
