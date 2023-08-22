import axios from 'axios';

const authorizationHeader = '';
const apiUrl = 'https://api.processout.ninja';

const apiClient = axios.create({
  baseURL: apiUrl,
  headers: { Authorization: authorizationHeader },
});

export const apiClientFetcher = (url: string) =>
  apiClient.get(url).then((res) => res.data);

export default apiClient;
