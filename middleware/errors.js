const { logger } = require('../utils/logger/logger');
const errorHandler = (err, req, res, next) => {
    let error = { ...err };

    error.message = err.message;

    if (error.validateErrors) {
        error.message = error.validateErrors;
    }

    logger.error(`time ${Date.now()} error : ${err.message}`);
    res.status(err.statusCode || 500).json({
        status: 'failed',
        errors: error.message || `Internal Server errors`
    });
};

module.exports = errorHandler;
