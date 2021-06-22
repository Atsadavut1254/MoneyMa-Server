const { Router } = require('express');
const router = Router({ mergeParams: true });

const { signup } = require('../../controller/auth');

router.route('/access-token').post(signup);

module.exports = router;
