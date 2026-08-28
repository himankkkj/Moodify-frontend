import { api } from '../../../lib/http.js'

let inMemoryToken = null

export const setInMemoryToken = (token) => {
  inMemoryToken = token
}

export const register = async (email, password, username, signal) => {
  const res = await api.post('/register', { email, password, username }, { signal })
  return res.data
}

export const login = async (email, password, username, signal) => {
  const res = await api.post('/login', { email, password, username }, { signal })
  return res.data
}

export const getUser = async (config = {}) => {
  const res = await api.get('/get-me', { _skipAuthRedirect: true, ...config })
  return res.data
}

export const refreshToken = async (signal) => {
  const res = await api.post('/refresh-token', {}, { signal })
  return res.data
}

export const logout = async (signal) => {
  const res = await api.post('/logout', {}, { signal })
  return res.data
}

export const logoutAllSessions = async (signal) => {
  const res = await api.post('/logout-all', {}, { signal })
  return res.data
}

export const verifyEmail = async (email, otp, signal) => {
  const res = await api.post('/verify-email', { email, otp }, { signal })
  return res.data
}

export const resendOtp = async (email, signal) => {
  const res = await api.post('/resend-otp', { email }, { signal })
  return res.data
}

// Request Interceptor: Attach in-memory access token
api.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`
  }
  return config
})

// Response Interceptor: Singleflight refresh promise to prevent stampede & session nuking
let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/refresh-token')) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/refresh-token')
            .then((res) => {
              const token = res.data.accessToken
              setInMemoryToken(token)
              return token
            })
            .finally(() => {
              refreshPromise = null
            })
        }

        await refreshPromise
        return api(originalRequest)
      } catch (refreshErr) {
        setInMemoryToken(null)
        // Skip hard redirect if this request explicitly opted out (e.g. initial boot getUser)
        if (!originalRequest._skipAuthRedirect && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(error)
  }
)