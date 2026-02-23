class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = {}) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }
}

module.exports = ApiResponse;
