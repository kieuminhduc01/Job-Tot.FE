import { useEffect, useState } from "react";
import { SavedJobsContext } from "./saved-jobs-context";

const STORAGE_KEY = "talenthub:saved-jobs";

function readSavedJobs() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function SavedJobsProvider({ children }) {
  const [savedIds, setSavedIds] = useState(readSavedJobs);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      /* Vẫn sử dụng được khi storage bị chặn. */
    }
  }, [savedIds]);

  function toggleSaved(id) {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <SavedJobsContext.Provider value={{ savedIds, toggleSaved }}>
      {children}
    </SavedJobsContext.Provider>
  );
}
