import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // sends httpOnly cookies automatically
});

// Request interceptor - attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - silently refresh token on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;


    // Skip interceptor for refresh endpoint itself and for login/register endpoints
    const skipInterceptor =
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register');

    if (skipInterceptor) {
      return Promise.reject(error);
    }

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests that come in while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh
        const { data } = await api.post('/auth/refresh');
        const newToken = data.accessToken;

        sessionStorage.setItem('accessToken', newToken);
        api.defaults.headers['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);

        // Retry the original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);

      } 
      catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } 
      finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;