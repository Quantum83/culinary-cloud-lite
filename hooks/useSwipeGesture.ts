import { useEffect, useRef } from "react";

export function useSwipeGesture(
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
  threshold = 60,
) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }

    function handleTouchEnd(e: TouchEvent) {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(
        touchStartY.current - e.changedTouches[0].clientY,
      );

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY * 2) {
        if (deltaX > 0 && !isOpen && touchStartX.current < 40) {
          // Swipe right from left edge → open
          onOpen();
        } else if (deltaX < 0 && isOpen) {
          // Swipe left → close
          onClose();
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    }

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, onOpen, onClose, threshold]);
}
