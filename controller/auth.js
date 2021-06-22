const asyncHandler = require('../middleware/async');
const ErrorHandler = require('../utils/errorsHandler/errorsHandler');
const jwt = require('jsonwebtoken');
// import { isEmpty } from '../utils/dataHandler/dataHandler';

// import database instance
const { admin, db } = require('../config/firebase-config');

// import lib
const { v4: uuidv4 } = require('uuid');

const { authValidate } = require('../utils/validator/auth');
// users collection
const users = db.collection('users');
const FieldValue = admin.firestore.FieldValue;

// import logger
const { logger } = require('../utils/logger/logger');

exports.signup = asyncHandler(async (req, res, next) => {
    let { errors, isValid } = authValidate(req.body);
    if (!isValid) {
        return next(new ErrorHandler(`Validation Error`, 400, errors));
    }
    try {
        const { userId, name, picture, email } = req.body;
        const _res = await users.where('userId', '==', userId).limit(1).get();
        let moneyMaId;
        if (_res.empty) {
            moneyMaId = `moneyma-${uuidv4()}`;
            const _check_email = await users.where('email', '==', email).get();
            if (!_check_email.empty) {
                return next(
                    new ErrorHandler(`Internal server error`, 500, null)
                );
            }

            const _res_create = await users.doc(moneyMaId).set({
                moneyMaId,
                userId,
                name,
                picture,
                email,
                craeteAt: FieldValue.serverTimestamp(),
                updateAt: FieldValue.serverTimestamp()
            });
            let token = generateToken({ moneyMaId });

            logger.info(`time ${Date.now()} authection success`);
            return res.status(201).json({
                status: 'success',
                accesstoken: token
            });
        }
        let data = _res.docs[0].data();
        moneyMaId = data.moneyMaId;
        let token = generateToken({ moneyMaId });

        logger.info(`time ${Date.now()} authection success`);
        res.status(200).json({
            status: 'success',
            accesstoken: token
        });
    } catch (error) {
        console.log(`error signin -> ${error}`);
        return next(new ErrorHandler(`Internal server error`, 500, null));
    }
});

const generateToken = (payload) => {
    token = jwt.sign(payload, process.env.SECRET_KEY_AUTH, {
        algorithm: 'HS256',
        expiresIn: 3600
    });

    return token;
};
