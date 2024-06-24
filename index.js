// require('dotenv').config()
import express from "express";
import cors from "cors";
import bodyparser from 'body-parser';
import http from 'http';
import { trainGPT, trainMenuSearchModel, trainModel, updateFineTuneModel } from "./controls/trainModel.js";
import { getFromAssistant, getFromAssistantModified, getJSONData, getPromptResponse, getResponseFromGPT, processLangChain, processLangChainTrain } from "./controls/processPrompts.js";

const app = express();
const server = http.createServer(app);


app.use(cors());
app.use(bodyparser.json({ limit: "25mb" }));

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

import { ChatOpenAI } from "@langchain/openai";

app.post('/test', async (req, res) => {
    const model = new ChatOpenAI({ 
        temperature: 0.5, 
        model: 'gpt-3.5-turbo',
        // verbose: true
    });

    let response = await model.stream('generate 100 word paragraph');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of response) {
        // Assuming chunk has a 'toString' method or a property that contains the string representation
        const text = chunk.content.toString(); // or chunk.somePropertyContainingString
        console.log(text);
        res.write(text);
      }

    res.end();
})

let port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log(`Listening on port ${port}`);
});