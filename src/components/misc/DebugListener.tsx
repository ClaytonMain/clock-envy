import { useEffect } from "react";
import useAppStore from "../../stores/useAppStore";
import * as UTILS from "../../utils/utils";

function updateAppStoreDebugFromHash() {
  const debug = window.location.hash === "#debug";
  const availableClockNames = UTILS.getAvailableClockNames(debug);
  useAppStore.setState({ debug, availableClockNames });
}

export default function DebugListener() {
  useEffect(() => {
    window.addEventListener("hashchange", updateAppStoreDebugFromHash);
    return () => {
      window.removeEventListener("hashchange", updateAppStoreDebugFromHash);
    };
  }, []);

  useEffect(() => {
    updateAppStoreDebugFromHash();
  }, []);

  return null;
}
