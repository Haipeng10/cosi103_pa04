//route for transaction
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mongoose = require('mongoose');
const formatAmount = require('../public/js/formatAmount');

isLoggedIn = (req, res, next) => {
    if (res.locals.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

router.get('/transaction',
    isLoggedIn,
    async (req, res, next) => {
        const sortBy = req.query.sortBy;
        let transactions = [];
        if (sortBy == 'date') {
            transactions = await Transaction.find({ userId: req.user._id }).sort({ date: 1 });
        } else if (sortBy == 'amount') {
            transactions = await Transaction.find({ userId: req.user._id }).sort({ amount: 1 });
        } else if (sortBy == 'category') {
            transactions = await Transaction.find({ userId: req.user._id }).sort({ category: 1 });
        } else {
            transactions = await Transaction.find({ userId: req.user._id });
        }
        console.log(transactions);
        res.render('transaction', { transactions, user: req.user, formatAmount });
    });

router.post('/transaction',
    isLoggedIn,
    async (req, res, next) => {
        const transaction = new Transaction({
            description: req.body.description,
            amount: req.body.amount,
            category: req.body.category,
            date: req.body.date,
            userId: req.user._id
        });
        await transaction.save();
        res.redirect('/transaction');
    });

router.get('/transaction/remove/:transactionId',
    isLoggedIn,
    async (req, res, next) => {
        console.log("inside /todo/remove/:transactionId")
        await Transaction.deleteOne({ _id: req.params.transactionId });
        res.redirect('/transaction');
    });

router.get('/transaction/edit/:transactionId',
    isLoggedIn,
    async (req, res, next) => {
        console.log("inside /transaction/edit/:transactionId")
        const transaction =
            await Transaction.findById(req.params.transactionId);
        res.render('editTransaction', { transaction, formatAmount });
    });

const getTransactionParams = (body) => {
    return {
        description: body.description,
        amount: body.amount,
        category: body.category,
        date: body.date,
    };
};

router.post('/transaction/edit/:transactionId',
    isLoggedIn,
    async (req, res, next) => {
        const transactionParams = getTransactionParams(req.body);
        await Transaction.findOneAndUpdate(
            { _id: req.params.transactionId },
            { $set: transactionParams });
        res.redirect('/transaction')
    });

router.get('/transaction/byCategory',
    isLoggedIn,
    async (req, res, next) => {
        let transactions =
            await Transaction.aggregate(
                [{
                    $match: {
                        userId: new mongoose.Types.ObjectId(req.user._id)
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        amount: { $sum: '$amount' }
                    }
                },
                { $sort: { amount: -1 } },
                ])
        res.render('groupByCategory', { transactions, user: req.user, formatAmount });
    });

module.exports = router;