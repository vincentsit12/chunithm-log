import Fuse from "fuse.js";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { GuessGameSong } from "@/games/GuessSongGame/types";

type SongAnswerInputProps = {
  items: GuessGameSong[];
  value?: string;
  onChange: (value: string) => void;
  onSelect: (item: GuessGameSong) => void;
  placeholder?: string;
  className?: string;
  maxListHeight?: number | string;
};

export default function SongAnswerInput({
  items,
  value,
  onChange,
  onSelect,
  placeholder = "Type your answer...",
  className,
  maxListHeight = 320,
}: SongAnswerInputProps) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["display_name"],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [items],
  );

  useEffect(() => {
    const nextValue = value ?? "";
    if (nextValue === "") {
      setQuery("");
      setOpen(false);
    }
  }, [value]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return items;
    }
    return fuse.search(query).map((result) => result.item);
  }, [fuse, items, query]);

  const computedMaxHeight =
    typeof maxListHeight === "number" ? `${maxListHeight}px` : maxListHeight;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        data-song-answer-input
        className={classNames("relative", className)}
      >
        <Popover.Anchor asChild>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
            }}
            className="guess-song-game-input px-4 py-2 w-full text-sm"
            placeholder={placeholder}
          />
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            side="top"
            align="start"
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("[data-song-answer-input]")) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("[data-song-answer-input]")) {
                e.preventDefault();
              }
            }}
            sideOffset={8}
            collisionPadding={12}
            avoidCollisions
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            style={{
              width: "var(--radix-popover-trigger-width)",
              maxHeight: `min(${computedMaxHeight}, var(--radix-popover-content-available-height))`,
            }}
            className="z-50 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-[#1E1E2E] py-1 shadow-2xl"
          >
            {results.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">
                No results
              </div>
            ) : (
              results.map((item, idx) => (
                <button
                  key={`${item.display_name}-${idx}`}
                  type="button"
                  tabIndex={-1}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-white/10 focus:outline-none focus-visible:outline-none"
                  onClick={() => {
                    setQuery(item.display_name);
                    onChange(item.display_name);
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  {item.display_name}
                </button>
              ))
            )}
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}
