import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

const Register = lazy(() => import("./features/auth/pages/Register.jsx"));
const Login = lazy(() => import("./features/auth/pages/Login.jsx"));
const Verification = lazy(
  () => import("./features/auth/pages/Verification.jsx"),
);
const Landing = lazy(() => import("./features/landing/pages/Landing.jsx"));

export const routes = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={null}>
        <Landing />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={null}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: "/verification",
    element: (
      <Suspense fallback={null}>
        <Verification />
      </Suspense>
    ),
  },
]);
