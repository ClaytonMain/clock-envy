import { useEffect } from "react";
import useAppStore from "../../stores/useAppStore";

export default function DebugListener() {
  useEffect(() => {
    const onHashChange = () => {
      useAppStore.setState({ debug: window.location.hash === "#debug" });
    };

    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    useAppStore.setState({ debug: window.location.hash === "#debug" });
  }, []);

  return null;
}
