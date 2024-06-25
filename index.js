import 'dotenv/config';
import express from "express";
import cors from 'cors'
import { trainGPT, trainMenuSearchModel, trainModel, updateFineTuneModel } from "./controls/trainModel.js";
import { getFromAssistant, getFromAssistantModified, getJSONData, getPromptResponse, getResponseFromGPT, processLangChain, processLangChainTrain } from "./controls/processPrompts.js";
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


app.post('/langChain', async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}/`);
});
