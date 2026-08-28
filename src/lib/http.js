import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: `${API_BASE}/api/auth`,
  withCredentials: true,
  timeout: 15000,
})

// Normalize error messages across all API calls
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error) {
      const respData = error.response?.data
      error.normalizedMessage =
        respData?.message ||
        respData?.error ||
        (Array.isArray(respData?.errors) ? respData.errors[0] : null) ||
        error.message ||
        'Something went wrong'
    }
    return Promise.reject(error)
  }
)
