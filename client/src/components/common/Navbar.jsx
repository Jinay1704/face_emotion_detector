import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Smile } from "lucide-react";
import {
  SignedIn, SignedOut,
  UserButton, useUser,
} from "@clerk/clerk-react";
import { getPlanBadgeClass } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";

export default function Navbar() {
  const { user }         = useUser();
  const { subscription } = useSubscription();
  const [open, setOpen]  = useState(false);
  const plan = subscription?.plan || "free";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
      <div className="section flex h-16 items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-white text-lg">
          <Smile className="h-6 w-6 text-indigo-400" />
          EmotionAI
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <SignedIn>
            {[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/history",   label: "History" },
              { to: "/pricing",   label: "Pricing" },
            ].map(({ to, label }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) =>
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors " +
                  (isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800")
                }
              >
                {label}
              </NavLink>
            ))}

            <div className="flex items-center gap-3 ml-3 pl-3 border-l border-gray-800">
              {/* Plan badge */}
              <span className={getPlanBadgeClass(plan)}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>

              {/* Clerk's built-in UserButton — handles avatar, profile, sign out */}
              <UserButton
                signOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox:      "h-8 w-8",
                    userButtonPopoverCard: "bg-gray-900 border border-gray-800",
                    userButtonPopoverActionButton: "text-gray-300 hover:bg-gray-800",
                    userButtonPopoverActionButtonText: "text-gray-300",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <NavLink to="/pricing" className="btn-ghost text-sm">Pricing</NavLink>
            <Link to="/sign-in"    className="btn-ghost text-sm">Log in</Link>
            <Link to="/sign-up"    className="btn-primary text-sm">Sign up free</Link>
          </SignedOut>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-gray-400 hover:text-white p-1" onClick={() => setOpen(o => !o)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 space-y-1">
          <SignedIn>
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <UserButton signOutUrl="/" />
              <div>
                <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <span className={getPlanBadgeClass(plan)}>{plan}</span>
              </div>
            </div>
            {["/dashboard", "/history", "/pricing", "/profile"].map((to) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 capitalize">
                {to.replace("/", "")}
              </Link>
            ))}
          </SignedIn>

          <SignedOut>
            <Link to="/pricing"  onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-300">Pricing</Link>
            <Link to="/sign-in"  onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-300">Log in</Link>
            <Link to="/sign-up"  onClick={() => setOpen(false)} className="btn-primary w-full mt-2">Sign up free</Link>
          </SignedOut>
        </div>
      )}
    </nav>
  );
}