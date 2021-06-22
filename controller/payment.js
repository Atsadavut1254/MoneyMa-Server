const asyncHandler = require('../middleware/async');
const ErrorHandler = require('../utils/errorsHandler/errorsHandler');

// import lib
const { v4: uuidv4 } = require('uuid');

// import database instance
const { admin, db } = require('../config/firebase-config');
const FieldValue = admin.firestore.FieldValue;

// import logger
const { logger } = require('../utils/logger/logger');

const sanboxUrl = 'https://api-sandbox.partners.scb/partners/sandbox';
const got = require('got');

const channel_header = 'scbeasy';

exports.getDeeplink = ({ ref1, ref2, ref3, amount }) => {
    return new Promise((resolve, reject) => {
        const data = {
            transactionType: 'PURCHASE',
            transactionSubType: ['BP'],
            billPayment: {
                paymentAmount: amount,
                accountTo: process.env.ACCOUNT_TO,
                ref1: ref1,
                ref2: ref2,
                ref3: ref3
            }
        };
        const url = sanboxUrl + '/v3/deeplink/transactions';

        createHeader()
            .then((res) => {
                got.post(url, {
                    headers: res,
                    body: JSON.stringify(data),
                    responseType: 'json'
                })
                    .then((res) => {
                        const result = res.body;
                        resolve(result.data.deeplinkUrl);
                    })
                    .catch((err) => {
                        console.log('err', err);
                        reject(err);
                    });
            })
            .catch((err) => {
                console.log('err1 ', err);
                reject(err);
            });
    });
};

exports.confirmPayment = asyncHandler(async (req, res, next) => {
    const { amount, billPaymentRef1, billPaymentRef3 } = req.body;
    const _res_song = await db
        .collectionGroup('song')
        .where('ref1', '==', billPaymentRef1)
        .limit(1)
        .get();
    if (_res_song.empty) {
        return next(new ErrorHandler(`Song Not Found`, 404));
    }

    let ref = _res_song.docs[0].ref.parent.parent;
    const _res_card = await db.collection('cards').doc(ref.id).get();
    if (!_res_card.exists) {
        return next(new ErrorHandler(`Card Not Found`, 404));
    }

    try {
        const batch = db.batch();

        batch.update(_res_card.ref, {
            totalamount:
                Number(_res_card.data().totalamount) +
                Number(_res_song.docs[0].data().amount),
            updatedAt: FieldValue.serverTimestamp()
        });

        batch.update(_res_song.docs[0].ref, {
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();
        return res.status(200).json({
            status: 'success',
            data: _res_song.docs[0].data.songId
        });
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler(`Internal server error`, 500, null));
    }
});

const createHeader = async () => {
    return new Promise((resolve, reject) => {
        const requestUId = uuidv4();
        getScbtoken()
            .then((res) => {
                console.log('res', res);
                resolve({
                    'Content-Type': 'application/json',
                    resourceOwnerId: process.env.RESOURCEOWNER_ID,
                    requestUId: requestUId,
                    authorization: 'Bearer ' + res,
                    channel: channel_header
                });
            })
            .catch((error) => {
                console.log('e', error);
                reject(error);
            });
    });
};

const getScbtoken = () => {
    return new Promise(async (resolve, reject) => {
        const requestUId = uuidv4();
        const header = {
            'Content-Type': 'application/json',
            resourceOwnerId: process.env.RESOURCEOWNER_ID,
            requestUId: requestUId
        };

        const data = {
            applicationKey: process.env.RESOURCEOWNER_ID,
            applicationSecret: process.env.APPLICATION_SECRET
        };

        const url = sanboxUrl + '/v1/oauth/token';
        got.post(url, {
            headers: header,
            body: JSON.stringify(data),
            responseType: 'json'
        })
            .then((res) => {
                const result = res.body;
                resolve(result.data.accessToken);
            })
            .catch((error) => {
                reject(error);
            });
    });
};
