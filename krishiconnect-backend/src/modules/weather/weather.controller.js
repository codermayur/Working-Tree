const weatherService = require('./weather.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getCurrentWeather = asyncHandler(async (req, res) => {
  const { state, district } = req.query;
  const weather = await weatherService.getCurrentWeather(state, district);
  res.status(200).json(new ApiResponse(200, weather, 'Weather fetched successfully'));
});

module.exports = {
  getCurrentWeather,
};
