import { useEffect, useRef, useState } from "react";

const THRESHOLD = 72;   // px pulled before triggering reload
const RESISTANCE = 2.5; // how much to dampen the pull

export function usePullToRefresh(scrollRef) {
  const [pullY, setPullY] = useState(0);  // 0–1 progress
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  useEffect(() => {
    const el = scrollRef?.current || document.documentElement;

    const onTouchStart = (e) => {
      const scrollTop = scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY;
      if (scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const delta = (e.touches[0].clientY - startY.current) / RESISTANCE;
      if (delta <= 0) { setPullY(0); return; }
      setPullY(Math.min(delta / THRESHOLD, 1));
    };

    const onTouchEnd = () => {
      if (pullY >= 1) {
        setRefreshing(true);
        // Let the spinner show for a moment then reload
        setTimeout(() => window.location.reload(), 500);
      }
      startY.current = null;
      setPullY(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullY, scrollRef]);

  return { pullY, refreshing };
}
