import type { SessionOptions } from "iron-session";

export interface SessionData {
  storeName: string;
  storeNames: string[];
  staffName: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "guest-eye-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export const defaultSession: SessionData = {
  storeName: "",
  storeNames: [],
  staffName: "",
  isLoggedIn: false,
};
