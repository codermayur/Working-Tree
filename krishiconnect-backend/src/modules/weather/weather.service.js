const Weather = require('./weather.model');
const ApiError = require('../../utils/ApiError');

const getCurrentWeather = async (state, district) => {
  let weather = await Weather.findOne({
    'location.state': new RegExp(state, 'i'),
    'location.district': new RegExp(district, 'i'),
  })
    .sort({ lastUpdated: -1 })
    .lean();

  if (!weather && process.env.OPENWEATHER_API_KEY) {
    // Placeholder for API integration - would call OpenWeather/IMD API
    weather = {
      location: { state, district },
      current: {
        temperature: 28,
        feelsLike: 30,
        humidity: 65,
        windSpeed: 12,
        rainfall: 0,
        condition: 'Clear sky',
        icon: '01d',
      },
      lastUpdated: new Date(),
    };
  }

  return weather;
};

module.exports = {
  getCurrentWeather,
};
