import { BackdropScene } from "@/components/ui/BackdropScene";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 text-center">
      <BackdropScene />
      <div className="relative z-10 max-w-lg rounded-[2rem] border border-violet-400/20 bg-brand-panel/82 p-10 text-slate-100 shadow-glow ring-1 ring-white/10 backdrop-blur-xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Not Found
        </p>
        <h2 className="text-3xl font-bold text-white">404 - Page Not Found</h2>
        <p className="mt-4 text-sm text-slate-300">
          The route you requested does not exist or has moved.
        </p>
      </div>
    </div>
  );
}
