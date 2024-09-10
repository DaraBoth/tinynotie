import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { getSession } from "next-auth/react";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_APIURL || 'https://tinynotie-api.vercel.app',
});

async function requestInterceptor(config: InternalAxiosRequestConfig) {
  const session: any = await getSession();
  if (session?.token.accessToken) {
    config.headers.Authorization = `Bearer ${session.token.accessToken}`; // Attach the token
  }
  config.headers["Content-Type"] = "application/json";
  return config;
}

async function responseInterceptor(value: AxiosResponse<any, any>) {
  return value;
}

async function responseErrorInterceptor({ status, code, ...err }: AxiosError) {
  const isNotWorkError = code == "ERR_NETWORK";
  if (isNotWorkError) {
    try {
      //
    } catch {
      /** in case called from server ignore client side function*/
    }
  }
  return Promise.reject({ ...err, status, code });
}

axiosClient.interceptors.request.use(requestInterceptor);
axiosClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor);
export default axiosClient;
