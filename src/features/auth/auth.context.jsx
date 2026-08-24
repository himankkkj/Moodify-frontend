import {createContext, useEffect, useState} from "react";
import { getUser } from "./services/auth.api.js";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null)

    useEffect(() => {
        getUser()
            .then(data => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    return (
        <AuthContext.Provider value={{user, setUser, loading, setLoading, accessToken, setAccessToken}}>
            {children}
        </AuthContext.Provider>
    )
}