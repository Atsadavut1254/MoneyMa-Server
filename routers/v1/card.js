const { Router } = require('express');
const router = Router({ mergeParams: true });

const { protect } = require('../../middleware/authentication');
const {
    createCard,
    editCard,
    getCardById,
    getlistCard,
    getTotalAmountByCardId,
    getListCostInCard,
    createCostInCard,
    deleteCostInCard,
    closeCard
} = require('../../controller/card');

const songRoute = require('./song');

router.use('/:cardId/song', songRoute);

router.route('/').get(protect, getlistCard).post(protect, createCard);

router.route('/:cardId').get(protect, getCardById).patch(protect, editCard);

router.route('/:cardId/total-amount').get(protect, getTotalAmountByCardId);

router.route('/:cardId/create-cost').post(protect, createCostInCard);

router.route('/:cardId/delete-cost/:budgetId').patch(protect, deleteCostInCard);

router.route('/:cardId/cost/').get(protect, getListCostInCard);

router.route('/:cardId/close-card/card').patch(protect, closeCard);

module.exports = router;
