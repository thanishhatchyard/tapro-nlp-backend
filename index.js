require('dotenv').config()
const express = require("express");
const cors = require("cors");
const bodyparser = require("body-parser");
const app = express();
const server = require('http').createServer(app);

const {trainMenuSearchModel, trainModel} = require("./controls/trainModel");
const { getPromptResponse } = require("./controls/processPrompts");

app.use(cors());
app.use(bodyparser.json({ limit: "25mb" }));

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Tapro NLP', requestParams: {...req.query}});
})

app.post('/train', async (req, res) => {
    let response;

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

let port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log(`Listening on port ${port}`);
});