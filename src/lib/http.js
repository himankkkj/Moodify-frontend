import axios from 'axios'

// Uses Vite environment variable in production, falls back to localhost in dev
const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const baseURL = rawBaseUrl.endsWith('/api/auth')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, '')}/api/auth`

const http = axios.create({
  baseURL,
  // REQUIRED: Allows sending and receiving secure cookies across domains (Pages -> Render)
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Normalize error messages across all API calls
http.interceptors.response.use(
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

export const api = http
export default http
