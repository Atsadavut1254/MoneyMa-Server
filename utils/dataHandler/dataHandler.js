const ErrorResponse = require('../errorsHandler/errorsHandler');

exports.isEmpty = (data) => {
    let errors = {
        result: false,
        error: null
    };

    const empty = data.empty;
    if (typeof empty === 'boolean' && empty) {
        errors.result = true;
        errors.error = new ErrorResponse(`Can not find: ${word}`, 404);
    }

    return errors;
};
