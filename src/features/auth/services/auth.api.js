import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:3000/api/auth',
    withCredentials: true,
})

export const register = async (email, password, username) => {
    try{
        const res = await api.post('/register', {
            email,
            password,
            username
        })
        return res.data
    } catch (error) {

        throw error
    }
}

export const login = async (email, password, username) => {
    try{
        const res = await api.post("/login", {
            email,
            password,
            username
        })
        return res.data
    } catch (error) {
        throw error
    }
}

export const getUser = async () => {
    try{
        const res = await api.get("/get-me")
        return res.data
    }catch (error){
        throw error
    }
}

export const refreshToken = async () => {
    try{
        const res = await api.post("/refresh-token")
        return res.data
    }catch (error) {

        throw error
    }
}

export const logout = async () => {
    try{
        const res = await api.post("/logout")
        return res.data

    }catch (error) {
        throw error
    }
}

export const logoutAllSessions = async () => {
    try{
        const res= await api.post("/logout-all")
        return res.data
    }catch (error) {
        throw error
    }
}

export const verifyEmail = async (email, otp) => {
    try{
        const res = await api.post("/verify-email", {
            email,
            otp
        })
        return res.data
    }catch (error) {
        throw error
    }
}

export const resendOtp = async (email) => {
    try{
        const res = await api.post("/resend-otp", {
            email
        })
        return res.data
    }catch (error){
        throw error
    }
}

let inMemoryToken = null

export const setInMemoryToken = (token) => {
    inMemoryToken = token
}

api.interceptors.request.use((config) => {
    if (inMemoryToken) {
        config.headers.Authorization = `Bearer ${inMemoryToken}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config

        // 401 = unauthorized = token expired
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true 

            try {
                const data = await api.post("/refresh-token")
                inMemoryToken = data.data.accessToken
                setInMemoryToken(inMemoryToken)
                return api(originalRequest)
            } catch (refreshError) {
                // refresh token also expired = force logout
                // user needs to login again after 7 days
                window.location.href = "/login"
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)