const validator = require('validator');
const { isEmpty } = require('./isEmpty');

exports.authValidate = (data) => {
    let errors = {};

    data.userId = !isEmpty(data.userId) ? data.userId : '';
    data.name = !isEmpty(data.name) ? data.name : '';
    data.picture = !isEmpty(data.picture) ? data.picture : '';
    data.email = !isEmpty(data.email) ? data.email : '';

    if (validator.isEmpty(data.userId)) errors.userId = `userId is required`;
    if (validator.isEmpty(data.name)) errors.name = `name is required`;
    if (validator.isEmpty(data.picture)) errors.picture = `picture is required`;
    if (!validator.isEmail(data.email)) errors.email = `email is required`;

    return {
        errors,
        isValid: isEmpty(errors)
    };
};
