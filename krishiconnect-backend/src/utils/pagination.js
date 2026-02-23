class Pagination {
  constructor(model) {
    this.model = model;
  }

  async paginate(query = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      populate = [],
      select = '',
    } = options;

    const skip = (page - 1) * limit;

    let queryBuilder = this.model.find(query).sort(sort).skip(skip).limit(limit);

    if (populate.length > 0) {
      populate.forEach((pop) => {
        queryBuilder = queryBuilder.populate(pop);
      });
    }

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    const [data, totalCount] = await Promise.all([
      queryBuilder.exec(),
      this.model.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: totalCount,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async cursorPaginate(query = {}, options = {}) {
    const {
      limit = 20,
      cursor = null,
      sort = { createdAt: -1 },
      populate = [],
      select = '',
    } = options;

    if (cursor) {
      const sortField = Object.keys(sort)[0];
      const sortOrder = sort[sortField];
      query[sortField] = sortOrder === 1 ? { $gt: cursor } : { $lt: cursor };
    }

    let queryBuilder = this.model.find(query).sort(sort).limit(limit + 1);

    if (populate.length > 0) {
      populate.forEach((pop) => {
        queryBuilder = queryBuilder.populate(pop);
      });
    }

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    const data = await queryBuilder.exec();
    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1]._id : null;

    return {
      data,
      pagination: {
        nextCursor,
        hasMore,
      },
    };
  }
}

module.exports = Pagination;
