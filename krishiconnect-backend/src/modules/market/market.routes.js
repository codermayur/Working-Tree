const express = require('express');
const router = express.Router();
const marketController = require('./market.controller');

router.get('/prices', marketController.getPrices);
router.get('/commodities', marketController.getCommodities);
router.get('/states', marketController.getStates);

module.exports = router;
