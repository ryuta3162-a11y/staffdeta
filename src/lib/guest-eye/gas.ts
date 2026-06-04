interface GasResponse {
  success?: boolean;
  error?: string;
  storeName?: string;
  staffName?: string;
  stores?: Array<{ area: string; territory: string; storeName: string } | string>;
  status?: string;
  message?: string;
  savedPassword?: string;
}

async function fetchGuestEyeGas(url: string, init: RequestInit): Promise<Response> {
  let response = await fetch(url, { ...init, redirect: "manual" });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      response = await fetch(location, { ...init, redirect: "follow" });
    }
  }

  return response;
}

function parseGasResponse(text: string): GasResponse {
  const cleaned = text.trim().replace(/^\uFEFF/, "");

  try {
    return JSON.parse(cleaned) as GasResponse;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as GasResponse;
    }

    if (cleaned.startsWith("<!DOCTYPE") || cleaned.startsWith("<html")) {
      throw new Error(
        "GAS（Google Apps Script）が正しく応答していません。Vercel の GUEST_EYE_GAS_WEB_APP_URL と API_SECRET を確認してください",
      );
    }

    throw new Error(
      "GAS からの応答を読み取れませんでした。Webアプリの再デプロイを確認してください",
    );
  }
}

export async function callGuestEyeGas(
  payload: Record<string, unknown>,
): Promise<GasResponse> {
  const url = process.env.GUEST_EYE_GAS_WEB_APP_URL;
  const secret = process.env.GUEST_EYE_GAS_API_SECRET;

  if (!url || !secret) {
    throw new Error(
      "GUEST_EYE_GAS_WEB_APP_URL または GUEST_EYE_GAS_API_SECRET が設定されていません",
    );
  }

  const response = await fetchGuestEyeGas(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret }),
    cache: "no-store",
  });

  const data = parseGasResponse(await response.text());
  if (!response.ok || data.error) {
    throw new Error(data.error || "GAS との通信に失敗しました");
  }

  return data;
}

export async function registerGuestEyeStores(
  storeNames: string[],
  staffName: string,
  password: string,
): Promise<GasResponse> {
  const uniqueStores = [...new Set(storeNames.map((name) => name.trim()).filter(Boolean))];
  if (uniqueStores.length === 0) {
    throw new Error("店舗を1つ以上選んでください");
  }

  let lastResult: GasResponse = {};
  for (const storeName of uniqueStores) {
    lastResult = await callGuestEyeGas({
      action: "register",
      storeName,
      staffName,
      password,
    });
  }

  return {
    ...lastResult,
    storeName: lastResult.storeName || uniqueStores[0],
    staffName: lastResult.staffName || staffName,
  };
}
