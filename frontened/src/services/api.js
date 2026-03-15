import axios from 'axios';

// API Configuration and Base Setup
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies for refresh token
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — kept for future auth header injection
axiosInstance.interceptors.request.use(
  (config) => {
    if (localStorage.getItem('isAdmin') === 'true') {
      if (typeof config.headers.set === 'function') {
        config.headers.set('x-admin-key', import.meta.env.VITE_ADMIN_KEY || 'playvibe_admin_2025');
      } else {
        config.headers['x-admin-key'] = import.meta.env.VITE_ADMIN_KEY || 'playvibe_admin_2025';
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Endpoints that should NEVER trigger a token-refresh attempt on 401.
// These are auth endpoints whose own 401 response is meaningful.
const NO_REFRESH_ENDPOINTS = [
  '/users/login',
  '/users/register',
  '/users/refresh-token',
  '/users/current-user',
  '/users/add-account',
  '/users/switch-account',
  '/admin',
];

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for auth-related endpoints so their own 401/400 errors
    // bubble up intact to the caller (e.g. "Password is incorrect").
    const isNoRefreshEndpoint = NO_REFRESH_ENDPOINTS.some(endpoint =>
      originalRequest?.url?.includes(endpoint)
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isNoRefreshEndpoint
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token via httpOnly cookie
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data?.success) {
          // New tokens set in cookies by backend – retry original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed – just reject so the component can decide what to do
      }
    }

    return Promise.reject(error);
  }
);

class ApiClient {
  constructor() {
    this.axios = axiosInstance;
  }

  // GET request
  async get(endpoint, config = {}) {
    try {
      const response = await this.axios.get(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST request
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await this.axios.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT request
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await this.axios.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH request
  async patch(endpoint, data = {}, config = {}) {
    try {
      const response = await this.axios.patch(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE request
  async delete(endpoint, config = {}) {
    try {
      const response = await this.axios.delete(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File upload (FormData)
  // DO NOT set Content-Type manually — axios will auto-set
  // 'multipart/form-data; boundary=...' when it detects a FormData body.
  // Setting it manually strips the boundary and breaks server-side parsing.
  async uploadFile(endpoint, formData, config = {}) {
    try {
      // Set to 'multipart/form-data' explicitly to override the instance's 'application/json' default.
      // Modern Axios automatically appends the correct boundary.
      const customConfig = { 
        ...config, 
        headers: { 
          ...config.headers, 
          'Content-Type': 'multipart/form-data' 
        } 
      };
      const response = await this.axios.post(endpoint, formData, customConfig);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler – always throws a real Error so callers get error.message
  handleError(error) {
    let message;
    let status = 0;

    if (error.response) {
      status = error.response.status;
      // Backend may use 'message' at the root or inside a 'data' wrapper
      message = error.response.data?.message
        || error.response.data?.data?.message
        || `Request failed with status ${status}`;
    } else if (error.request) {
      message = 'Network error - no response from server';
    } else {
      message = error.message || 'An unexpected error occurred';
    }

    const err = new Error(message);
    err.status = status;
    err.data = error.response?.data || null;
    return err;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
