const STORAGE_KEY = "guest-eye-saved-auth";

interface SavedAuth {
  staffName: string;
  password: string;
}

export function loadSavedAuth(): SavedAuth | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const data = JSON.parse(raw) as Partial<SavedAuth>;
    if (data.staffName && data.password) {
      return {
        staffName: data.staffName.trim(),
        password: data.password,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveSavedAuth(data: SavedAuth) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      staffName: data.staffName.trim(),
      password: data.password,
    }),
  );
}

/** @deprecated loadSavedName の互換用 */
export function loadSavedName(): string {
  return loadSavedAuth()?.staffName || "";
}

/** @deprecated saveSavedName の互換用 */
export function saveSavedName(staffName: string) {
  const saved = loadSavedAuth();
  saveSavedAuth({
    staffName,
    password: saved?.password || "",
  });
}
