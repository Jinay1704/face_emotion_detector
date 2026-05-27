import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <BrowserRouter
        future={{
          v7_startTransition:   true,   // fixes React Router warning 1
          v7_relativeSplatPath: true,   // fixes React Router warning 2
        }}
      >
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151", fontSize: "14px" },
            success: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
            duration: 4000,
          }}
        />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);