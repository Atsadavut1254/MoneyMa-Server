const asyncHandler = require('../middleware/async');
const ErrorHandler = require('../utils/errorsHandler/errorsHandler');

// import database instance
const { admin, db } = require('../config/firebase-config');

// import lib
const { v4: uuidv4 } = require('uuid');

// import validate
const { acceptSongValidate } = require('../utils/validator/acceptSong');
const { updateSongValidate } = require('../utils/validator/updateSong');

// import logger
const { logger } = require('../utils/logger/logger');

const { getDeeplink } = require('./payment');

const users = db.collection('users');
const cards = db.collection('cards');
const songs = db.collection('songs');
const FieldValue = admin.firestore.FieldValue;

function generateRef() {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 15; i++) {
        result.push(
            characters.charAt(Math.floor(Math.random() * charactersLength))
        );
    }
    return result.join('');
}

exports.acceptSong = asyncHandler(async (req, res, next) => {
    const { isValid, errors } = acceptSongValidate(req.body);
    if (!isValid) {
        return next(new ErrorHandler(`Validation Error`, 400, errors));
    }

    const { userId, name, picture, email, info_song } = req.body;
    const { approve, greeting, amount } = info_song;
    let status = approve;

    const cardId = req.params.cardId;
    let moneyMaId = `moneyma-${uuidv4()}`;
    let songId = `song-${uuidv4()}`;
    const batch = db.batch();
    const _userRef = users.doc(moneyMaId);
    const _songRef = cards.doc(cardId).collection('song').doc(songId);

    const _cardRef = cards.doc(cardId);
    const cardRef = await _cardRef.get();
    if (!cardRef.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }
    let cardDoc = cardRef.data();
    if (!cardDoc.status) {
        return next(new ErrorHandler(`Card Errors`, 400));
    }

    if (cardDoc.date <= Date.now()) {
        return next(new ErrorHandler(`Can't accept card`, 400));
    }

    let acceptTotal = cardDoc.accepttotal + 1;
    let canceltotal = cardDoc.canceltotal;
    if (!status) {
        acceptTotal = cardDoc.accepttotal;
        canceltotal += 1;
    }
    const userRef = await users.where('userId', '==', userId).limit(1).get();

    try {
        let ref1 = generateRef();
        let ref2 = generateRef();
        let ref3 = 'MGH' + generateRef();
        if (userRef.empty) {
            batch.set(_userRef, {
                moneyMaId,
                userId,
                name,
                picture,
                email,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
            batch.set(_songRef, {
                songId,
                moneyMaId,
                status,
                greeting: greeting,
                amount: amount,
                userRef: _userRef,
                ref1: ref1,
                ref2: ref2,
                ref3: ref3,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        } else {
            let data = userRef.docs[0].data();
            moneyMaId = data.moneyMaId;
            const songRef = await _cardRef
                .collection('song')
                .where('moneyMaId', '==', moneyMaId)
                .limit(1)
                .get();
            if (!songRef.empty) {
                let songDocs = songRef.docs[0].data();
                songId = songDocs.songId;
                if (songDocs.status == status) {
                    return res.status(200).json({
                        status: 'success',
                        data: 'song existing'
                    });
                } else {
                    batch.update(songRef.docs[0].ref, {
                        status,
                        updateAt: FieldValue.serverTimestamp()
                    });
                    if (status) {
                        canceltotal -= 1;
                    } else {
                        acceptTotal -= 1;
                    }
                }
            } else {
                batch.set(_songRef, {
                    songId,
                    moneyMaId,
                    status,
                    greeting: greeting,
                    amount: amount,
                    userRef: _userRef,
                    ref1: ref1,
                    ref2: ref2,
                    ref3: ref3,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
            }
        }

        batch.update(cardRef.ref, {
            accepttotal: acceptTotal,
            canceltotal: canceltotal,
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();

        let deepRes = await getDeeplink({ ref1, ref2, ref3, amount });

        logger.info(`time ${Date.now()} accept song success`);
        res.status(201).json({
            status: 'success',
            data: {
                songId,
                deepLink: deepRes
            }
        });
    } catch (error) {
        batch.delete(_songRef);
        batch.delete(_userRef);
        await batch.commit();
        console.log(`error accept song -> ${error}`);
        return next(new ErrorHandler(`Internal server error`, 500, null));
    }
});

exports.getSongByUserId = asyncHandler(async (req, res, next) => {
    const cardId = req.params.cardId;
    const userId = req.params.userId;
    const userRef = await users.where('userId', '==', userId).limit(1).get();
    if (userRef.empty) {
        return next(new ErrorHandler(`You are not allowed`, 401));
    }
    let userDoc = userRef.docs[0].data();

    const snapshot = await cards
        .doc(cardId)
        .collection('song')
        .where('moneyMaId', '==', userDoc.moneyMaId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return next(new ErrorHandler(`Not found`, 404));
    }

    let songDoc = snapshot.docs[0].data();

    logger.info(`time ${Date.now()} get song by id success`);
    res.status(200).json({
        status: 'success',
        data: songDoc
    });
});

exports.getListSongs = asyncHandler(async (req, res, next) => {
    const cardId = req.params.cardId;
    const moneyMaId = req.user.moneyMaId;
    let limit = req.query.limit;
    let songId = req.query.songId;
    let status = req.query.status;

    const _cardRef = cards.doc(cardId);
    const cardRef = await _cardRef.get();
    let cardDoc = cardRef.data();
    if (!cardRef.exists) {
        return next(new ErrorHandler(`Not found`, 404));
    }
    if (cardDoc.createBy !== moneyMaId) {
        return next(new ErrorHandler(`You not allowed`, 401));
    }

    if (!limit) {
        limit = 10;
    }
    limit = parseInt(limit, 16);
    const _songRef = _cardRef.collection('song');

    let songRef = _songRef.orderBy('createdAt').limit(limit);
    if (status) {
        status = status === 'true';
        songRef = songRef.where('status', '==', status);
    }

    if (songId) {
        const snapshot = await _songRef.doc(songId).get();
        if (!snapshot.exists) {
            return next(new ErrorHandler(`Not found`, 404));
        }
        songRef = songRef.startAfter(snapshot);
    }

    let snapshot = await songRef.get();

    let guests = [];
    for (song of snapshot.docs) {
        let data = song.data();
        let userRef = await data.userRef.get();
        let user = userRef.data();

        let _res = {
            songId: data.songId,
            guest: user,
            amount: data.amount,
            greeting: data.greeting
        };
        guests.push(_res);
    }

    logger.info(`time ${Date.now()} get list song success`);
    res.status(200).json({
        stauts: 'success',
        data: {
            card: {
                cardId: cardId,
                totalamount: cardDoc.totalamount
            },
            guests
        }
    });
});
