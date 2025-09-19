import axios from 'axios';
const api = axios.create({
  baseURL: 'https://crm.sitestaginglink.com/api'
});
export default api;
