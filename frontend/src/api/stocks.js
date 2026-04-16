import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const getTop10Stocks = async () => {
  const response = await api.get('/stocks/top10');
  return response.data;
};

export const getStockHistory = async (ticker) => {
  const response = await api.get(`/stocks/${ticker}/history`);
  return response.data;
};

export const analyzeStock = async (ticker) => {
  const response = await api.post(`/stocks/${ticker}/analyze`);
  return response.data;
};
