const validator = require('validator');
const { isEmpty } = require('./isEmpty');

exports.cardValidate = (data) => {
    let errors = {};

    let type = ['wedding', 'ordination', 'housewarming'];

    data.hostOne = !isEmpty(data.hostOne) ? data.hostOne : '';
    data.hostTwo = !isEmpty(data.hostTwo) ? data.hostTwo : '';
    data.phone = !isEmpty(data.phone) ? data.phone : '';
    data.date = !isEmpty(data.date) ? data.date : '';
    data.type = !isEmpty(data.type) ? data.type : '';
    data.locationName = !isEmpty(data.locationName) ? data.locationName : '';
    data.location = !isEmpty(data.location) ? data.location : '';

    if (validator.isEmpty(data.hostOne))
        errors.hostOne = `host one is required`;
    if (validator.isEmpty(data.hostTwo))
        errors.hostTwo = `host two is required`;
    if (validator.isEmpty(data.phone)) errors.phone = `phone is required`;
    if (!validator.isLength(data.phone, { min: 10, max: 10 }))
        errors.phone = `phone is required`;
    if (validator.isEmpty(data.type)) errors.type = `type is required`;
    if (validator.isEmpty(data.date)) errors.date = `date is required`;
    if (!validator.isISO8601(data.date)) errors.date = `date format wrong`;
    if (
        typeof data.location.lat !== 'number' &&
        !validator.isLatLong(data.location.lat.toString())
    )
        errors.location = `location is required`;
    if (
        typeof data.location.long !== 'number' &&
        !validator.isLatLong(data.location.long.toString())
    )
        errors.location = `location is required`;

    if (!type.includes(data.type)) errors.type = `type wrong`;
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
