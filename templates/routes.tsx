import { createBrowserRouter } from "react-router";
import { Landing } from "./components/pages/landing";
import { Tracker } from "./components/pages/tracker";
import { Wishlist } from "./components/pages/wishlist";
import { Currency } from "./components/pages/currency";
import { Statistics } from "./components/pages/statistics";
import { Login } from "./components/pages/login";
import { Signup } from "./components/pages/signup";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/tracker",
    element: (
      <ProtectedRoute>
        <Tracker />
      </ProtectedRoute>
    ),
  },
  {
    path: "/wishlist",
    element: (
      <ProtectedRoute>
        <Wishlist />
      </ProtectedRoute>
    ),
  },
  {
    path: "/currency",
    Component: Currency,
  },
  {
    path: "/statistics",
    Component: Statistics,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
],
  { basename: "/app" }

);
