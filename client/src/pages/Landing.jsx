import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Zap, Shield, BarChart2, Video, Image, Smile } from "lucide-react";

const features = [
  { icon: <Image className="h-5 w-5" />,     title: "Image Detection",    desc: "Get instant emotion detection on every face in any uploaded photo." },
  { icon: <Video className="h-5 w-5" />,     title: "Video Analysis",     desc: "Process videos frame by frame with full timeline emotion tracking." },
  { icon: <Zap className="h-5 w-5" />,       title: "EfficientNet-B4",    desc: "Fine-tuned deep learning model — fast, accurate, runs in under 1s." },
  { icon: <Shield className="h-5 w-5" />,    title: "Secure via Clerk",   desc: "Auth handled by Clerk. Email, Google, GitHub — sign in your way." },
  { icon: <BarChart2 className="h-5 w-5" />, title: "Confidence Charts",  desc: "Per-face probability bars for angry, happy, and sad." },
  { icon: <Smile className="h-5 w-5" />,     title: "Prediction History", desc: "All your past predictions saved and searchable in your dashboard." },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 sm:py-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="section relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-800 text-indigo-300 text-xs font-medium mb-6">
            <Zap className="h-3 w-3" /> Powered by EfficientNet-B4 + Clerk Auth
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
            Detect emotions with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI precision</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Upload images or videos and get instant emotion analysis — angry, happy, sad — on every face detected.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <Link to="/sign-up" className="btn-primary btn-lg text-base px-8">Start for free</Link>
              <Link to="/pricing" className="btn-secondary btn-lg text-base px-8">View pricing</Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="btn-primary btn-lg text-base px-8">Go to Dashboard</Link>
            </SignedIn>
          </div>
          <div className="flex items-center justify-center gap-4 mt-12">
            {[["😠","Angry","bg-red-500/10 border-red-500/30 text-red-400"],
              ["😊","Happy","bg-yellow-500/10 border-yellow-500/30 text-yellow-400"],
              ["😢","Sad","bg-blue-500/10 border-blue-500/30 text-blue-400"]
            ].map(([emoji, label, cls]) => (
              <div key={label} className={`px-4 py-2 rounded-full border text-sm font-medium ${cls}`}>
                {emoji} {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-gray-800">
        <div className="section">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Everything you need</h2>
            <p className="text-gray-400">Powerful emotion AI in a simple interface</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card hover:border-gray-600 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-indigo-900/40 flex items-center justify-center text-indigo-400 mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-gray-800 text-center">
        <div className="section">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to try it?</h2>
          <p className="text-gray-400 mb-8">Free plan · 10 predictions/month · No credit card needed</p>
          <SignedOut>
            <Link to="/sign-up" className="btn-primary btn-lg text-base px-10">Create free account</Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="btn-primary btn-lg text-base px-10">Go to Dashboard</Link>
          </SignedIn>
        </div>
      </section>
    </div>
  );
}