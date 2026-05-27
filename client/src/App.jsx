import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import Navbar     from "./components/common/Navbar";
import Footer     from "./components/common/Footer";
import Landing    from "./pages/Landing";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard  from "./pages/Dashboard";
import History    from "./pages/History";
import Pricing    from "./pages/Pricing";
import Checkout   from "./pages/Checkout";
import Profile    from "./pages/Profile";

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"         element={<Landing />} />
          <Route path="/pricing"  element={<Pricing />} />

          {/* Clerk sign-in — needs /* for subroutes like /factor-one, /sso-callback */}
          <Route path="/sign-in"   element={<SignInPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />

          {/* Clerk sign-up — needs /* for subroutes like /verify-email-address */}
          <Route path="/sign-up"   element={<SignUpPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/history"   element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/checkout"  element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}