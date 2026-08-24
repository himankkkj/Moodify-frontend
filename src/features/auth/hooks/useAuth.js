import * as api from "../services/auth.api.js";
import { AuthContext } from "../auth.context.jsx";
import { useContext  } from "react";
import { setInMemoryToken } from "../services/auth.api.js";

export const useAuth = () => {

    const context = useContext(AuthContext);

    if(!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    const { user, setUser, loading, setLoading, accessToken, setAccessToken } = context;

    async function handleRegister(email, password, username) {
        setLoading(true);
        try{
            const data = await api.register(email, password, username);
            setUser(data.user);
            return data;
        }catch (error) {
            throw error;
        }
        finally {
            setLoading(false);
        }
    }

    async function handleLogin(username, email, password) {
        setLoading(true);
        try{
            const data = await api.login(email, password, username);
            setUser(data.user);
            setAccessToken(data.accessToken);
            setInMemoryToken(data.accessToken)
            return data;
        }catch (error) {
            throw error;
        }
        finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        setLoading(true);
        try{
            const data = await api.logout();
            setUser(null);
            setAccessToken(null) 
            setInMemoryToken(null)
        }catch (error) {
            throw error;
        }
        finally {
            setLoading(false);
        }
    }

    async function handleLogoutAllSessions() {
        setLoading(true);
        try{
            const data = await api.logoutAllSessions();
            setUser(null);
            setAccessToken(null);
            setInMemoryToken(null)
        }catch (error) {
            throw error;
        }
        finally {
            setLoading(false);
        }
    }

    async function handleGetUser() {
        setLoading(true);
        try{
            const data = await api.getUser();
            setUser(data.user);
        }catch(error) {
            throw error;
        }finally {
            setLoading(false);
        }
    }
    async function handleRefreshToken() {
        setLoading(true);
        try{
            const data = await api.refreshToken();
            return data;
        }catch(error) {
            throw error;
        }finally {
            setLoading(false);
        }
    }

    async function handleResendOtp(email) {
        setLoading(true);
        try{
            const data = await api.resendOtp(email);
            return data;
        }catch(error) {
            throw error;
        }finally {
            setLoading(false);
        }
    }
    async function handleVerifyEmail(email, otp) {
        setLoading(true);
        try{
            const data = await api.verifyEmail(email, otp);
            setUser(data.user);
            return data;
        }catch(error) {
            throw error;
        }finally {
            setLoading(false);
        }
    }


    return {
        user,
        loading,
        isAuthenticated: !!user,
        handleRegister,
        handleLogin,
        handleLogout,
        handleLogoutAllSessions,
        handleGetUser,
        handleRefreshToken,
        handleResendOtp,
        handleVerifyEmail
    }
}