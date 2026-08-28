import * as api from "../services/auth.api.js";
import { AuthContext } from "../auth.context.jsx";
import { useContext } from "react";
import { setInMemoryToken } from "../services/auth.api.js";

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    const {
        user,
        setUser,
        bootLoading,
        authActionLoading,
        setAuthActionLoading,
        accessToken,
        setAccessToken,
    } = context;

    async function handleRegister(payloadOrEmail, passwordArg, usernameArg) {
        let email, password, username;
        if (typeof payloadOrEmail === "object" && payloadOrEmail !== null) {
            ({ email, password, username } = payloadOrEmail);
        } else {
            email = payloadOrEmail;
            password = passwordArg;
            username = usernameArg;
        }

        setAuthActionLoading(true);
        try {
            const data = await api.register(email, password, username);
            // Don't setUser here — user must verify email first
            return data;
        } catch (error) {
            throw error;
        } finally {
            setAuthActionLoading(false);
        }
    }

    async function handleLogin(payloadOrIdentifier, passwordArg) {
        let email, username, password;

        if (typeof payloadOrIdentifier === "object" && payloadOrIdentifier !== null) {
            const { identifier, email: e, username: u, password: p } = payloadOrIdentifier;
            password = p;
            if (identifier) {
                if (identifier.includes("@")) email = identifier;
                else username = identifier;
            } else {
                email = e;
                username = u;
            }
        } else {
            if (payloadOrIdentifier && payloadOrIdentifier.includes("@")) email = payloadOrIdentifier;
            else username = payloadOrIdentifier;
            password = passwordArg;
        }

        setAuthActionLoading(true);
        try {
            const data = await api.login(email, password, username);
            setUser(data.user);
            setAccessToken(data.accessToken);
            setInMemoryToken(data.accessToken);
            return data;
        } catch (error) {
            throw error;
        } finally {
            setAuthActionLoading(false);
        }
    }

    async function handleLogout() {
        setAuthActionLoading(true);
        try {
            await api.logout();
            setUser(null);
            setAccessToken(null);
            setInMemoryToken(null);
        } catch (error) {
            throw error;
        } finally {
            setAuthActionLoading(false);
        }
    }

    async function handleLogoutAllSessions() {
        setAuthActionLoading(true);
        try {
            await api.logoutAllSessions();
            setUser(null);
            setAccessToken(null);
            setInMemoryToken(null);
        } catch (error) {
            throw error;
        } finally {
            setAuthActionLoading(false);
        }
    }

    async function handleGetUser() {
        try {
            const data = await api.getUser();
            setUser(data.user);
            return data;
        } catch (error) {
            throw error;
        }
    }

    async function handleRefreshToken() {
        try {
            const data = await api.refreshToken();
            return data;
        } catch (error) {
            throw error;
        }
    }

    async function handleResendOtp(email) {
        setAuthActionLoading(true);
        try {
            const data = await api.resendOtp(email);
            return data;
        } catch (error) {
            throw error;
        } finally {
            setAuthActionLoading(false);
        }
    }

    async function handleVerifyEmail(email, otp) {
        setAuthActionLoading(true);
        try {
            const data = await api.verifyEmail(email, otp);
            setUser(data.user);
            return data;
        } catch (error) {
            throw error;
        } finally {
            setAuthActionLoading(false);
        }
    }

    return {
        user,
        bootLoading,
        authActionLoading,
        loading: bootLoading || authActionLoading, // backward-compatibility alias
        isAuthenticated: !!user,
        handleRegister,
        handleLogin,
        handleLogout,
        handleLogoutAllSessions,
        handleGetUser,
        handleRefreshToken,
        handleResendOtp,
        handleVerifyEmail,
    };
};