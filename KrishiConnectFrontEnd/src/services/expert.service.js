/**
 * Expert API for CropDoctor "Ask an Expert". Uses shared api (Bearer token).
 */
import { api } from './api';

export const expertService = {
  /** GET /experts — random experts (role: expert). Returns array. */
  async getExperts() {
    const res = await api.get('/experts');
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : (data ? [data] : []);
  },
};
