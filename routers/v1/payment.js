const { Router } = require('express');
const router = Router({ mergeParams: true });

const { confirmPayment } = require('../../controller/payment');

router.route('/scb/confirm').post(confirmPayment);

module.exports = router;
