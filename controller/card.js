const asyncHandler = require('../middleware/async');
const ErrorHandler = require('../utils/errorsHandler/errorsHandler');

// import database instance
const { admin, db } = require('../config/firebase-config');

// import lib
const { v4: uuidv4 } = require('uuid');

// import validate
const { cardValidate } = require('../utils/validator/card');
const { costValidate } = require('../utils/validator/createCost');
const { isEmpty } = require('../utils/dataHandler/dataHandler');

const cards = db.collection('cards');
const FieldValue = admin.firestore.FieldValue;

// import fn generate excel
const { gennerateExcel } = require('../utils/excel/excel');

// import upload file to firebase storage
const { uploadFiletoStorage } = require('../utils/upload/firestore-upload.js');

// import logger
const { logger } = require('../utils/logger/logger');

exports.createCard = asyncHandler(async (req, res, next) => {
    const { errors, isValid } = cardValidate(req.body);
    if (!isValid) {
        console.log(errors);
        return next(new ErrorHandler(`Validation Error`, 400, errors));
    }

    const { hostOne, hostTwo, phone, date, type, locationName, location } =
        req.body;
    const moneyMaId = req.user.moneyMaId;
    const cardId = `cardId-${uuidv4()}`;
    let conDate = new Date(date);

    try {
        const _cardRef = await cards
            .where('createBy', '==', moneyMaId)
            .where('status', '==', true)
            .get();

        if (!_cardRef.empty) {
            // check card is true status 3 card
            if (_cardRef.size == 3) {
                console.log('error create card -> card full');
                return next(new ErrorHandler(`Error create card!`, 400));
            }
            // check type and date of card
            for (card of _cardRef.docs) {
                let data = card.data();
                if (data.type === type) {
                    return next(new ErrorHandler(`Error create card!`, 400));
                }
                let dateT = new Date(data.date);

                if (dateT.getDay() === conDate.getDay()) {
                    if (dateT.getMonth() === conDate.getMonth()) {
                        if (dateT.getFullYear() === conDate.getFullYear()) {
                            console.log('error create card -> time');
                            return next(
                                new ErrorHandler(`Error create card!`, 400)
                            );
                        }
                    }
                }
            }
        }

        // create card
        const _res = await cards.doc(cardId).set({
            cardId,
            hostOne,
            hostTwo,
            phone,
            date,
            locationName,
            location,
            status: true,
            accepttotal: 0,
            canceltotal: 0,
            totalamount: 0.0,
            fileURL: '',
            type,
            createBy: moneyMaId,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

        logger.info(`time ${Date.now()} create card success`);
        res.status(201).json({
            status: 'success',
            data: {
                cardId: cardId
            }
        });
    } catch (error) {
        console.log(`error create card -> ${error}`);
        return next(new ErrorHandler(`Internal server error`, 500, null));
    }
});

exports.editCard = asyncHandler(async (req, res, next) => {
    const { errors, isValid } = cardValidate(req.body);
    if (!isValid) {
        return next(new ErrorHandler(`Validation Error`, 400, errors));
    }

    const { hostOne, hostTwo, phone, date, type, locationName, location } =
        req.body;
    const cardId = req.params.cardId;
    const moneyMaId = req.user.moneyMaId;
    const cardRef = cards.doc(cardId);
    const _res_card = await cardRef.get();
    if (!_res_card.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }

    let card = _res_card.data();
    // check status card
    if (!card.status) {
        return next(new ErrorHandler(`Error something with card`, 400));
    }
    // check authorization
    if (card.createBy != moneyMaId) {
        return next(new ErrorHandler(`You are not allowed`, 400));
    }
    // check date if now is after date card
    if (Date.parse(card.date) <= Date.now()) {
        return next(new ErrorHandler(`Can't edit card...`, 400));
    }

    try {
        const _res = await cardRef.update({
            hostOne,
            hostTwo,
            phone,
            date,
            type,
            location,
            locationName,
            updatedAt: FieldValue.serverTimestamp()
        });

        logger.info(`time ${Date.now()} update card success`);
        res.status(200).json({
            status: 'success',
            data: {
                cardId: cardId
            }
        });
    } catch (error) {
        console.log(`error edit card -> ${error}`);
        return next(new ErrorHandler(`Internal server error`, 500));
    }
});

exports.getlistCard = asyncHandler(async (req, res, next) => {
    const moneyMaId = req.user.moneyMaId;
    let limit = req.query.limit;
    let cardId = req.query.cardId;

    if (!limit) {
        limit = 10;
    }
    limit = parseInt(limit, 16);
    let cardRef = cards
        .where('createBy', '==', moneyMaId)
        .limit(limit)
        .orderBy('createdAt', 'desc');

    // pagination
    if (cardId) {
        const lastRef = await cards.doc(cardId).get();
        if (!lastRef.exists) {
            return next(new ErrorHandler(`Not found`, 404));
        }
        cardRef = cardRef.startAfter(lastRef);
    }
    const snapshot = await cardRef.get();

    let cardsDoc = [];
    for (cardDoc of snapshot.docs) {
        let data = cardDoc.data();
        delete data.status;
        delete data.accepttotal;
        delete data.canceltotal;
        delete data.totalamount;
        cardsDoc.push(data);
    }

    logger.info(`time ${Date.now()} get list card success`);
    res.status(200).json({
        status: 'success',
        data: cardsDoc
    });
});

exports.getCardById = asyncHandler(async (req, res, next) => {
    const cardId = req.params.cardId;

    const snapshot = await cards.doc(cardId).get();
    if (!snapshot.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }

    let cardDoc = snapshot.data();
    delete cardDoc.accepttotal;
    delete cardDoc.canceltotal;
    delete cardDoc.totalamount;

    logger.info(`time ${Date.now()} get card by id success`);
    res.status(200).json({
        status: 'success',
        data: cardDoc
    });
});

exports.getTotalAmountByCardId = asyncHandler(async (req, res, next) => {
    const cardId = req.params.cardId;
    const moneyMaId = req.user.moneyMaId;

    const cardRef = await cards.doc(cardId).get();
    if (!cardRef.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }
    let cardDoc = cardRef.data();
    if (!cardDoc.status) {
        return next(new ErrorHandler(`Card Error`, 400));
    }
    if (cardDoc.createBy !== moneyMaId) {
        return next(new ErrorHandler(`You are not allow`, 401));
    }

    logger.info(`time ${Date.now()} get total amount by card id success`);
    res.status(200).json({
        status: 'success',
        data: {
            totalamount: cardDoc.totalamount
        }
    });
});

exports.createCostInCard = asyncHandler(async (req, res, next) => {
    const { isValid, errors } = costValidate(req.body);
    if (!isValid) {
        return next(new ErrorHandler(`Validation Error`, 400, errors));
    }

    const cardId = req.params.cardId;
    const moneyMaId = req.user.moneyMaId;
    const batch = db.batch();
    const { costName, price } = req.body;
    const _cardRef = cards.doc(cardId);
    const snapshot = await _cardRef.get();
    let cardDoc = snapshot.data();
    if (!snapshot.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }
    if (cardDoc.createBy !== moneyMaId) {
        return next(new ErrorHandler(`You are not allowed`, 401));
    }
    if (!cardDoc.status) {
        return next(new ErrorHandler(`Can't add cost in event!`, 400));
    }

    const budgetId = `budgetId-${uuidv4()}`;
    const _budgetRef = _cardRef.collection('budget').doc(budgetId);

    try {
        batch.set(_budgetRef, {
            budgetId,
            costName,
            price,
            createBy: moneyMaId,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        batch.update(_cardRef, {
            totalamount: cardDoc.totalamount,
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();

        logger.info(`time ${Date.now()} create cost in card success`);
        res.status(201).json({
            status: 'success',
            data: {
                budgetId: budgetId
            }
        });
    } catch (error) {
        console.log(`error create cost -> ${error}`);
        return next(new ErrorHandler(`Internal server error`, 500, null));
    }
});

exports.deleteCostInCard = asyncHandler(async (req, res, next) => {
    const cardId = req.params.cardId;
    const budgetId = req.params.budgetId;
    const moneyMaId = req.user.moneyMaId;

    const batch = db.batch();
    const _cardRef = cards.doc(cardId);
    const snapshot = await _cardRef.get();
    let cardDoc = snapshot.data();
    if (!snapshot.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }
    if (cardDoc.createBy !== moneyMaId) {
        return next(new ErrorHandler(`You are not allowed`, 401));
    }
    if (!cardDoc.status) {
        return next(new ErrorHandler(`Can't delete cost in event!`, 400));
    }

    const _budgetRef = _cardRef.collection('budget').doc(budgetId);
    const budgetRef = await _budgetRef.get();
    if (!budgetRef.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }
    let budgetDoc = budgetRef.data();

    try {
        batch.delete(_budgetRef);

        batch.update(_cardRef, {
            totalamount: cardDoc.totalamount,
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();

        logger.info(`time ${Date.now()} delete cost in card success`);
        res.status(200).json({
            status: 'success',
            data: 'budget is deleted'
        });
    } catch (error) {
        console.log(`error delete cost -> ${error}`);
        return next(new ErrorHandler(`Internal server error`, 500, null));
    }
});

exports.getListCostInCard = asyncHandler(async (req, res, next) => {
    const cardId = req.params.cardId;
    const moneyMaId = req.user.moneyMaId;
    let limit = req.query.limit;
    let budgetId = req.query.budgetId;

    const _cardRef = cards.doc(cardId);
    const snapshot = await _cardRef.get();
    let cardDoc = snapshot.data();
    if (!snapshot.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }
    if (cardDoc.createBy !== moneyMaId) {
        return next(new ErrorHandler(`You are not allowed`, 401));
    }
    if (!limit) {
        limit = 10;
    }
    limit = parseInt(limit, 16);
    let budgetRef = _cardRef
        .collection('budget')
        .orderBy('createdAt', 'desc')
        .limit(limit);
    if (budgetId) {
        const snapshots = await _cardRef
            .collection('budget')
            .doc(budgetId)
            .get();
        if (!snapshots.exists) {
            return next(new ErrorHandler(`Not found`, 404));
        }
        budgetRef = budgetRef.startAfter(snapshots);
    }
    let budgetDocs = await budgetRef.get();

    let budgets = [];
    for (budget of budgetDocs.docs) {
        let data = budget.data();
        budgets.push(data);
    }

    logger.info(`time ${Date.now()} get list cost in card success`);
    res.status(200).json({
        status: 'success',
        data: {
            budgets
        }
    });
});

// TODO: waiting test func and payment sys.
exports.closeCard = asyncHandler(async (req, res, next) => {
    const cardId = req.params.cardId;
    const moneyMaId = req.user.moneyMaId;

    const _cardRef = cards.doc(cardId);
    const cardRef = await _cardRef.get();
    if (!cardRef.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }

    let cardDoc = cardRef.data();
    if (cardDoc.createBy !== moneyMaId) {
        return next(new ErrorHandler(`You are not allow`, 401));
    }

    if (Date.parse(cardDoc.date) >= Date.now()) {
        return next(new ErrorHandler(`Event can't close`, 400));
    }

    const _songRef = await _cardRef.collection('song').get();
    if (_songRef.empty) {
        return next(new ErrorHandler(`Can't close card`, 500));
    }

    let songs = [];
    for (item of _songRef.docs) {
        let song = item.data();
        let userRef = await song.userRef.get();
        let user = userRef.data();
        let data = {
            songId: song.songId,
            guestId: user.name,
            amount: song.amount,
            greeting: song.greeting
        };
        songs.push(data);
    }

    try {
        const buffer = await gennerateExcel(songs);
        const url = await uploadFiletoStorage(
            `${cardDoc.type}_${cardDoc.cardId}.csv`,
            buffer,
            cardDoc.type,
            cardDoc.cardId
        );

        const _res = _cardRef.update({
            stauts: false,
            fileURL: url,
            updatedAt: FieldValue.serverTimestamp()
        });

        logger.info(`time ${Date.now()} close card success`);
        res.status(200).json({
            status: 'success'
        });
    } catch (error) {
        console.log(`error close crad -> ${error}`);
        return next(new ErrorHandler(`Internal server error`, 500, null));
    }
});
