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
    setPosition({ x: dockRect.left, y: dockRect.top });
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
    if (!position) return;

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        return clampPosition(prev.x, prev.y);
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition, position]);

  return {
    dockRef,
    position,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
