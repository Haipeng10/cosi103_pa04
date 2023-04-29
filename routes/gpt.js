//route for gpt
const express = require('express');
const router = express.Router();
const GPT = require('../models/gpt');
const User = require('../models/User');
const mongoose = require('mongoose');
const { Configuration, OpenAIApi } = require("openai");

// Configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

isLoggedIn = (req, res, next) => {
    if (res.locals.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

// show all gpt queries
router.get('/gpt', isLoggedIn, async (req, res, next) => {
    const gptItems = await GPT.find({ userId: req.user._id });
    res.render('gpt', { user: req.user, gptItems });
});

// add a new gpt query
router.post("/gpt", async (req, res) => {
    try {
        const prefix = 'Add comments to below code: (just show me the code with comments, no extra words)';
        let prompt = prefix + req.body.code;
        console.log('prompt=', prompt);
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${prompt}`,
            max_tokens: 1024,
            temperature: 0.5,
            n: 1,
            stop: null,
        });
        let gptItem = new GPT({
            prompt: req.body.code,
            answer: response.data.choices[0].text,
            userId: req.user._id
        });
        await gptItem.save();
        return res.render("gptResponse", { answer: response.data.choices[0].text });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.response
                ? error.response.data
                : "There was an issue on the server",
        });
    }
});

// remove a gpt query
router.get('/gpt/remove/:gptId',
    isLoggedIn,
    async (req, res, next) => {
        console.log("inside /gpt/remove/:gptId")
        await GPT.deleteOne({ _id: req.params.gptId });
        res.redirect('/gpt');
    });

module.exports = router;