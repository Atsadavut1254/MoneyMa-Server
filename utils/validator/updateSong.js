const validator = require('validator');
const { isEmpty } = require('./isEmpty');

exports.updateSongValidate = (data) => {
    let errors = {};

    data.userId = !isEmpty(data.userId) ? data.userId : '';
    data.amount = !isEmpty(data.amount) ? data.amount : '';
    data.greeting = !isEmpty(data.greeting) ? data.greeting : '';

    if (validator.isEmpty(data.userId)) errors.userId = `userId is required`;
    if (
        typeof data.amount === 'number' &&
        !validator.isNumeric(data.amount.toString())
    )
        errors.amount = `amount is reqiured`;
    if (validator.isEmpty(data.greeting))
        errors.greeting = `greeting is required`;

    return {
        errors,
        isValid: isEmpty(errors)
    };
};
