import { useEffect, useRef, useState } from "react";

const THRESHOLD = 72;
const RESISTANCE = 2.5;

export function usePullToRefresh(scrollRef) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullProgress = useRef(0); // ref so touchend always reads the latest value

  useEffect(() => {
    const onTouchStart = (e) => {
      const scrollTop = scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY;
      if (scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const delta = (e.touches[0].clientY - startY.current) / RESISTANCE;
      if (delta <= 0) { pullProgress.current = 0; setPullY(0); return; }
      const progress = Math.min(delta / THRESHOLD, 1);
      pullProgress.current = progress;
      setPullY(progress);
    };

    const onTouchEnd = () => {
      if (pullProgress.current >= 1) {
        setRefreshing(true);
        setTimeout(() => window.location.reload(), 500);
      }
      startY.current = null;
      pullProgress.current = 0;
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
  }, [scrollRef]); // no pullY dependency — use ref instead

  return { pullY, refreshing };
}
