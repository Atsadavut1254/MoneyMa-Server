const validator = require('validator');
const { isEmpty } = require('./isEmpty');

exports.acceptSongValidate = (data) => {
    let errors = {};

    let song = data.info_song;
    data.userId = !isEmpty(data.userId) ? data.userId : '';
    data.name = !isEmpty(data.name) ? data.name : '';
    data.picture = !isEmpty(data.picture) ? data.picture : '';
    data.email = !isEmpty(data.email) ? data.email : '';
    song.approve = !isEmpty(song.approve) ? song.approve : '';
    song.greeting = !isEmpty(song.greeting) ? song.greeting : '';
    song.amount = !isEmpty(song.amount) ? song.amount : '';

    if (validator.isEmpty(data.userId)) errors.userId = `userId is reqiured`;
    if (validator.isEmpty(data.name)) errors.name = `name is required`;
    if (validator.isEmpty(data.picture)) errors.picture = `picture is required`;
    if (!validator.isEmail(data.email)) errors.email = `email is required`;
    if (
        typeof song.approve === 'boolean' &&
        !validator.isBoolean(song.approve.toString())
    )
        errors.status = `status is required`;
    if (validator.isEmpty(song.greeting))
        errors.greeting = `approve is required`;
    if (
        typeof song.amount === 'number' &&
        !validator.isNumeric(song.amount.toString())
    )
        errors.amount = `amount is required`;

    return {
        errors,
        isValid: isEmpty(errors)
    };
};
