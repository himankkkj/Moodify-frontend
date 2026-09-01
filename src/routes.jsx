import { createBrowserRouter, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./features/auth/components/ProtectedRoute.jsx";
import PlayerGate from "./features/player/components/PlayerGate.jsx";

const Register = lazy(() => import("./features/auth/pages/Register.jsx"));
const Login = lazy(() => import("./features/auth/pages/Login.jsx"));
const Verification = lazy(() => import("./features/auth/pages/Verification.jsx"));
const Terms = lazy(() => import("./features/legal/pages/Terms.jsx"));
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
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F0E8' }} />}>
            <Landing />
          </Suspense>
        ),
      },
      {
        path: "/login",
        element: (
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F0E8' }} />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: "/register",
        element: (
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F0E8' }} />}>
            <Register />
          </Suspense>
        ),
      },
      {
        path: "/terms",
        element: (
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F0E8' }} />}>
            <Terms />
          </Suspense>
        ),
      },
      {
        path: "/verification",
        element: (
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F0E8' }} />}>
            <Verification />
          </Suspense>
        ),
      },
      {
        path: "/mood",
        element: (
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F0E8' }} />}>
            <MoodPage />
          </Suspense>
        ),
      },
      {
        path: "/gesture",
        element: (
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F0E8' }} />}>
            <ProtectedRoute>
              <GesturePage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
    ],
  },
]);
