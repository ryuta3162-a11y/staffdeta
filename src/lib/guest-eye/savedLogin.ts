const STORAGE_KEY = "guest-eye-saved-name";

export function loadSavedName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function saveSavedName(staffName: string) {
  localStorage.setItem(STORAGE_KEY, staffName.trim());
}
