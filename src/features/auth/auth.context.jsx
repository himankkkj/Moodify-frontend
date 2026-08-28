import { createContext, useEffect, useMemo, useState } from "react";
import { getUser } from "./services/auth.api.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [bootLoading, setBootLoading] = useState(true);
    const [authActionLoading, setAuthActionLoading] = useState(false);
    const [accessToken, setAccessToken] = useState(null);

    useEffect(() => {
        getUser({ _skipAuthRedirect: true })
            .then(data => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setBootLoading(false));
    }, []);

    const value = useMemo(() => ({
        user,
        setUser,
        bootLoading,
        authActionLoading,
        setAuthActionLoading,
        accessToken,
        setAccessToken,
        loading: bootLoading || authActionLoading, // backward-compatibility alias
    }), [user, bootLoading, authActionLoading, accessToken]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};