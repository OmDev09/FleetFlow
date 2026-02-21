import { useEffect, useRef } from "react";

export function usePollingRefresh(refresh: () => void | Promise<void>, intervalMs = 5000) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const run = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void refreshRef.current();
    };

    run();
    const timer = window.setInterval(run, intervalMs);
    const onFocus = () => void refreshRef.current();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshRef.current();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
