const validator = require('validator');
const { isEmpty } = require('./isEmpty');

exports.costValidate = (data) => {
    let errors = {};

    data.costName = !isEmpty(data.costName) ? data.costName : '';
    data.price = !isEmpty(data.price) ? data.price : '';

    if (validator.isEmpty(data.costName))
        errors.costName = `cost name is required`;
    if (typeof data.price !== 'number' && !validator.isNumeric(data.costName))
        errors.price = `price is required`;

    return {
        errors,
        isValid: isEmpty(errors)
    };
};
