class ErrorResponse extends Error {
    constructor(message, statusCode, validateErrors = undefined) {
        super(message);
        this.statusCode = statusCode;
        this.validateErrors = validateErrors;
    }
}

module.exports = ErrorResponse;
