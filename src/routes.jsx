import { createBrowserRouter, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./features/auth/components/ProtectedRoute.jsx";
import PlayerGate from "./features/player/components/PlayerGate.jsx";

const Register = lazy(() => import("./features/auth/pages/Register.jsx"));
const Login = lazy(() => import("./features/auth/pages/Login.jsx"));
const Verification = lazy(() => import("./features/auth/pages/Verification.jsx"));
const Landing = lazy(() => import("./features/landing/pages/Landing.jsx"));
const MoodPage     = lazy(() => import("./features/mood/pages/MoodPage.jsx"));
const GesturePage  = lazy(() => import("./features/gesture/pages/GesturePage.jsx"));

function RootLayout() {
  return (
    <>
      <Outlet />
      <PlayerGate />
    </>
  );
}

export const routes = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
      {
        path: "/mood",
        element: (
          <Suspense fallback={null}>
            <MoodPage />
          </Suspense>
        ),
      },
      {
        path: "/gesture",
        element: (
          <Suspense fallback={null}>
            <ProtectedRoute>
              <GesturePage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
    ],
  },
]);
