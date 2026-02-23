const MarketPrice = require('./market.model');
const ApiError = require('../../utils/ApiError');
const Pagination = require('../../utils/pagination');

const marketPagination = new Pagination(MarketPrice);

const getPrices = async (query = {}) => {
  const { state, district, commodity, date, page = 1, limit = 50 } = query;

  const filter = {};
  if (state) filter.state = new RegExp(state, 'i');
  if (district) filter.district = new RegExp(district, 'i');
  if (commodity) filter.commodity = new RegExp(commodity, 'i');
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.priceDate = { $gte: d, $lt: next };
  }

  return marketPagination.paginate(filter, {
    page,
    limit,
    sort: { priceDate: -1 },
  });
};

const getCommodities = async () => {
  return MarketPrice.distinct('commodity').sort();
};

const getStates = async () => {
  return MarketPrice.distinct('state').sort();
};

module.exports = {
  getPrices,
  getCommodities,
  getStates,
};
