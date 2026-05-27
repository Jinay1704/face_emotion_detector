import { Link } from "react-router-dom";
import { Smile } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-auto">
      <div className="section py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Smile className="h-5 w-5 text-indigo-400" />
          <span className="font-semibold text-white">EmotionAI</span>
          <span className="text-sm">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link to="/pricing" className="hover:text-gray-300">Pricing</Link>
          <a href="#" className="hover:text-gray-300">Privacy</a>
          <a href="#" className="hover:text-gray-300">Terms</a>
        </div>
      </div>
    </footer>
  );
}