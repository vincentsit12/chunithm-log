import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MdOpenInNew } from "react-icons/md";
import { BackdropScene } from "@/components/ui/BackdropScene";

type Props = {
  children: React.ReactNode;
};

const pageMeta: Record<
  string,
  { section: string; title: string; description: string }
> = {
  "/login": {
    section: "Account",
    title: "Sign In",
    description: "Sign in to open your rating tables, song tools, and game rooms.",
  },
  "/signup": {
    section: "Account",
    title: "Create Account",
    description: "Create a profile to save scores, track ratings, and use the site tools.",
  },
  "/home": {
    section: "Dashboard",
    title: "Player Overview",
    description:
      "View your bookmarklet, rating averages, recent songs, and best record tables in one place.",
  },
  "/song": {
    section: "Library",
    title: "Song Directory",
    description: "Search the song list by title or rate and jump into each chart's details.",
  },
  "/song/[song]": {
    section: "Library",
    title: "Song Details",
    description: "Switch difficulties, open charts or YouTube results, and estimate scores and rating gains.",
  },
  "/playground": {
    section: "Playground",
    title: "Pattern Sandbox",
    description: "Test note timelines, tweak chart patterns, and launch the in-browser game preview.",
  },
  "/song/manage": {
    section: "Admin",
    title: "Manage Songs",
    description: "Add a new song entry by filling in chart rates and combo data for each difficulty.",
  },
  "/user/[id]": {
    section: "Profile",
    title: "Player Profile",
    description:
      "Review another player's averages, recent records, and best rating tables.",
  },
};

const LayoutWrapper: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const currentPage = pageMeta[router.pathname] ?? {
    section: "Chuni-Log",
    title:
      router.pathname
        .split("/")
        .filter(Boolean)
        .map((segment) => segment.replace(/[[\]]/g, "").replace(/-/g, " "))
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" / ") || "Overview",
      description: "Use this page to manage records, inspect songs, or launch Chunithm tools.",
  };

  return (
    <>
      <BackdropScene />
      <div className="relative min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <Head>
          <title>{`${currentPage.title} | Chuni-log`}</title>
        </Head>
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-8">
            <div className="rounded-[2rem] border border-violet-400/20 bg-brand-panel/72 p-6 shadow-glow ring-1 ring-white/10 backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {currentPage.title}
                  </h1>
                  <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                    {currentPage.description}
                  </p>
                </div>
                <div className="flex justify-end sm:pt-1">
                  <a
                    href="https://chunithm-net-eng.com/mobile/home"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cyan-400/15 bg-white/6 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 transition hover:border-cyan-300/30 hover:bg-white/12 hover:text-white"
                  >
                    Chunithm Net
                    <MdOpenInNew className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto w-full">{children}</div>
        </div>
      </div>
    </>
  );
};
export default LayoutWrapper;
