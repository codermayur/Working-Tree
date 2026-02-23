const marketService = require('./market.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getPrices = asyncHandler(async (req, res) => {
  const result = await marketService.getPrices(req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Prices fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const getCommodities = asyncHandler(async (req, res) => {
  const commodities = await marketService.getCommodities();
  res.status(200).json(new ApiResponse(200, commodities, 'Commodities fetched'));
});

const getStates = asyncHandler(async (req, res) => {
  const states = await marketService.getStates();
  res.status(200).json(new ApiResponse(200, states, 'States fetched'));
});

module.exports = {
  getPrices,
  getCommodities,
  getStates,
};
