require('dotenv').config();
const express = require('express'),
    cors = require('cors');

// import error
const errorHandler = require('./middleware/errors');

// import logger
const { logger } = require('./utils/logger/logger');
// init express
const app = express();

// middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// init port
const port = process.env.PORT || 9000;
// const port = 9000 || process.env.port;

const auth = require('./routers/v1/auth');
const card = require('./routers/v1/card');
const song = require('./routers/v1/song');
const payment = require('./routers/v1/payment');
app.use('/v1/auth', auth);
app.use('/v1/card', card);
app.use('/v1/song', song);
app.use('/v1/payment', payment);

app.route('/').get((req, res, next) => {
    res.status(200).json({
        status: 'success'
    });
});

// error handler
app.use(errorHandler);

app.listen(port, () => {
    logger.info(`time ${Date.now()} server running on port -> ${port}`);
});
