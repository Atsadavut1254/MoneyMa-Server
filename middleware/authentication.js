const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorsHandler/errorsHandler');

exports.protect = (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        console.log(`missing `, token);
        return next(new ErrorResponse(`Unauthorization`, 401));
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY_AUTH);
        req.user = {
            moneyMaId: decoded.moneyMaId
        };

        next();
    } catch (error) {
        console.log(error);

        return next(new ErrorResponse(`Invalid Token`, 401));
    }
};
