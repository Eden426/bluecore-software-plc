import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Bluecore Support` : "Bluecore Support";
  }, [title]);
}
