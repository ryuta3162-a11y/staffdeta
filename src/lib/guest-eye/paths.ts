const isStandalone = process.env.NEXT_PUBLIC_APP_MODE === "guest-eye";

export const guestEyePaths = {
  root: isStandalone ? "/" : "/guest-eye",
  login: isStandalone ? "/login" : "/guest-eye/login",
  register: isStandalone ? "/register" : "/guest-eye/register",
  home: isStandalone ? "/home" : "/guest-eye/home",
  apiAuth: (mode: "login" | "register") =>
    isStandalone ? `/api/auth/${mode}` : `/guest-eye/api/auth/${mode}`,
  apiLogout: isStandalone ? "/api/auth/logout" : "/guest-eye/api/auth/logout",
  apiReport: isStandalone ? "/api/report" : "/guest-eye/api/report",
  apiStores: isStandalone ? "/api/stores" : "/guest-eye/api/stores",
  apiStaffLookup: isStandalone ? "/api/staff/lookup" : "/guest-eye/api/staff/lookup",
};
