import classNames from "classnames";

type SongGuesserLogoProps = {
  className?: string;
  wordmarkClassName?: string;
  compact?: boolean;
};

export function SongGuesserLogo({
  className,
  compact = false,
  wordmarkClassName,
}: SongGuesserLogoProps) {
  return (
    <div className={classNames("flex items-center justify-center", className)}>
      <span
        className={classNames(
          "bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text font-black tracking-tight text-transparent drop-shadow-[0_0_24px_rgba(34,211,238,0.18)]",
          compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
          wordmarkClassName,
        )}
      >
        So♫Guesser
      </span>
    </div>
  );
}