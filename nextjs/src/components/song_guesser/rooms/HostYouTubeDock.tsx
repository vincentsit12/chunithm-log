import classNames from "classnames";
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";
import { MdChevronLeft, MdChevronRight, MdPlayArrow, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { Button } from "@/components/ui/Button";

type Position = { x: number; y: number } | null;

interface HostYouTubeDockProps {
  position: Position;
  dockRef: RefObject<HTMLDivElement>;
  isExpanded: boolean;
  isShowVideo: boolean;
  onToggleExpanded: () => void;
  onToggleShowVideo: () => void;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

const HostYouTubeDock = ({
  position,
  dockRef,
  isExpanded,
  isShowVideo,
  onToggleExpanded,
  onToggleShowVideo,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  children,
}: HostYouTubeDockProps) => {
  return (
    <div
      className={classNames(
        "fixed z-30 pointer-events-none",
        !position && "bottom-20 left-2 md:left-4",
      )}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : undefined
      }
    >
      <div
        ref={dockRef}
        className="pointer-events-auto w-[calc(100vw-1rem)] max-w-[360px] rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(17,21,43,0.98),rgba(26,33,66,0.95))] backdrop-blur-xl shadow-2xl"
      >
        <div
          className="flex items-center justify-between p-4 border-b border-white/10 select-none touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="flex items-center gap-2">
            <MdPlayArrow className="w-5 h-5 text-rose-400" />
            <span className="text-white font-bold">Music Player</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon-sm" onClick={onToggleExpanded}>
              {isExpanded ? (
                <MdChevronRight className="w-4 h-4" />
              ) : (
                <MdChevronLeft className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={onToggleShowVideo}
              disabled={!isExpanded}
            >
              {isShowVideo ? (
                <MdVisibilityOff className="w-4 h-4" />
              ) : (
                <MdVisibility className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <div
          className={classNames(
            "p-4 transition-all duration-200",
            !isExpanded && "hidden",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default HostYouTubeDock;
