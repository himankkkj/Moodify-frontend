import {createBrowserRouter} from "react-router-dom";
import Register from "./features/auth/pages/Register.jsx";
import Login from "./features/auth/pages/Login.jsx";
import Verification from "./features/auth/pages/Verification.jsx";
import Landing from "./features/landing/pages/Landing.jsx"

export const routes =  createBrowserRouter([
    
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/verification",
        element: <Verification />
    },
    {
        path: "/",
        element: <Landing /> 
    },
])