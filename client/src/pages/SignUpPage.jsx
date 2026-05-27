import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Start detecting emotions for free</p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary:         "#4f46e5",
              colorBackground:      "#111827",
              colorInputBackground: "#030712",
              colorInputText:       "#f9fafb",
              colorText:            "#e5e7eb",
              borderRadius:         "8px",
            },
          }}
        />
      </div>
    </div>
  );
}