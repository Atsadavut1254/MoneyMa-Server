const { createLogger, format, transports, level } = require('winston');

exports.logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: `YYYY-MM-DD HH:mm:ss` }),
        format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`
        ),
        format.colorize()
    ),
    transports: [
        new transports.Console(),
        new transports.File({
            filename: `./log/log-info.log`,
            maxFiles: 5,
            maxsize: 5242880,
            level: 'info'
        }),
        new transports.File({
            filename: `./log/log-error.log`,
            maxFiles: 5,
            maxsize: 5242880,
            level: 'error'
        })
    ]
});
