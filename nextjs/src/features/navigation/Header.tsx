"use client";

import { Disclosure, Transition } from "@headlessui/react";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { Fragment } from "react";
import { Button } from "@/components/ui/Button";

const navigationLinks = [
  { href: "/song", label: "Song List" },
  { href: "/playground", label: "Playground" },
  { href: "/song_guesser/rooms", label: "Song Guesser" },
];

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const haveSession =
    session && router.pathname !== "/login" && router.pathname !== "/signup";
  const shouldShowHeader = !router.pathname.startsWith("/song_guesser");

  if (!shouldShowHeader) {
    return null;
  }

  return (
    <Disclosure
      as="header"
      className="fixed inset-x-0 top-0 z-50 border-b border-violet-400/15 bg-slate-950/70 backdrop-blur-xl shadow-lg shadow-black/30"
    >
      {({ open, close }) => (
        <>
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href={haveSession ? "/home" : "/login"}
              className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold tracking-[0.24em] text-white shadow-sm ring-1 ring-white/10 transition hover:bg-white/15"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
              CHUNI-LOG
            </Link>
            <Disclosure.Button as={Button} className="text-white shadow-sm" size="icon" variant="secondary">
              <span className="sr-only">Toggle navigation</span>
              <div className="relative h-5 w-5">
                <span
                  className={classNames(
                    "absolute left-0 top-1 block h-0.5 w-5 rounded-full bg-current transition",
                    { "translate-y-1.5 rotate-45": open },
                  )}
                />
                <span
                  className={classNames(
                    "absolute left-0 top-2.5 block h-0.5 w-5 rounded-full bg-current transition",
                    { "opacity-0": open },
                  )}
                />
                <span
                  className={classNames(
                    "absolute left-0 top-4 block h-0.5 w-5 rounded-full bg-current transition",
                    { "-translate-y-1.5 -rotate-45": open },
                  )}
                />
              </div>
            </Disclosure.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition duration-200 ease-out"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition duration-150 ease-in"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <Disclosure.Panel className="border-t border-violet-400/10 bg-slate-950/90 backdrop-blur-xl">
              <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:px-6 lg:px-8">
                <Link
                  href={haveSession ? "/home" : "/login"}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                  onClick={() => close()}
                >
                  {haveSession ? "Home" : "Login"}
                </Link>
                {navigationLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    onClick={() => close()}
                  >
                    {item.label}
                  </Link>
                ))}
                {session?.user.isAdmin && (
                  <Link
                    href="/song/manage"
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    onClick={() => close()}
                  >
                    Song Management
                  </Link>
                )}
                {haveSession && (
                  <Button
                    type="button"
                    className="w-full min-w-0 justify-start px-4 text-left"
                    size="sm"
                    onClick={() => {
                      close();
                      signOut();
                    }}
                  >
                    Logout
                  </Button>
                )}
              </nav>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}
