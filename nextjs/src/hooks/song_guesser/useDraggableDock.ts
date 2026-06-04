import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export function useDraggableDock() {
  const dockRef = useRef<HTMLDivElement>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const clampPosition = useCallback((x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const dockWidth = dockRef.current?.offsetWidth ?? 360;
    const dockHeight = dockRef.current?.offsetHeight ?? 320;
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - dockWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - dockHeight - margin);

    return {
      x: Math.min(Math.max(x, margin), maxX),
      y: Math.min(Math.max(y, margin), maxY),
    };
  }, []);

  const clampToViewport = useCallback(() => {
    setPosition((prev) => {
      if (prev) {
        return clampPosition(prev.x, prev.y);
      }

      const dockRect = dockRef.current?.getBoundingClientRect();
      if (!dockRect) return prev;

      return clampPosition(dockRect.left, dockRect.top);
    });
  }, [clampPosition]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement)?.closest("button")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const dockRect = dockRef.current?.getBoundingClientRect();
    if (!dockRect) return;

    dragPointerIdRef.current = e.pointerId;
    dragOffsetRef.current = {
      x: e.clientX - dockRect.left,
      y: e.clientY - dockRect.top,
    };
    setPosition(clampPosition(dockRect.left, dockRect.top));
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== e.pointerId) return;
    setPosition(
      clampPosition(
        e.clientX - dragOffsetRef.current.x,
        e.clientY - dragOffsetRef.current.y,
      ),
    );
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== e.pointerId) return;
    dragPointerIdRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      clampToViewport();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const dockElement = dockRef.current;
    const resizeObserver =
      dockElement && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handleResize)
        : null;

    if (dockElement && resizeObserver) {
      resizeObserver.observe(dockElement);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [clampToViewport]);

  return {
    dockRef,
    position,
    clampToViewport,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
