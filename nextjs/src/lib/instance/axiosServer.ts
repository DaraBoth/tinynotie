import axios from 'axios';
import { auth } from '../helper';

const axiosServer = axios.create({
  baseURL: process.env.NEXT_APIURL, // Replace with your API base URL
});

// Add a request interceptor to attach the token to headers
axiosServer.interceptors.request.use(
  async (config) => {
    const session:any = await auth(); // Get the session from NextAuth
    if (session?.token.accessToken) {
      config.headers.Authorization = `Bearer ${session.token.accessToken}`; // Attach the token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosServer;
