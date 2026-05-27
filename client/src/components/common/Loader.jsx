export default function Loader({ size = "md", text = "" }) {
  const s = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg className={`animate-spin text-indigo-500 ${s[size]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return <div className="min-h-[60vh] flex items-center justify-center"><Loader size="lg" text="Loading..." /></div>;
}