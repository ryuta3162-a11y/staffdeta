interface GasResponse {
  success?: boolean;
  error?: string;
  storeName?: string;
  staffName?: string;
  stores?: Array<{ area: string; territory: string; storeName: string }> | string[];
  status?: string;
  message?: string;
  savedPassword?: string;
}

function parseGasResponse(text: string): GasResponse {
  const cleaned = text
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^\)\]\}'\n?/, "");

  if (cleaned.startsWith("<!DOCTYPE") || cleaned.startsWith("<html")) {
    throw new Error(
      "GAS（Google Apps Script）が HTML を返しました。Vercel の GUEST_EYE_GAS_WEB_APP_URL と API_SECRET を確認してください",
    );
  }

  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    throw new Error(
      "GAS から JSON 以外の応答が返りました。Webアプリの再デプロイと API_SECRET を確認してください",
    );
  }

  try {
    return JSON.parse(cleaned) as GasResponse;
  } catch {
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

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret }),
    cache: "no-store",
    redirect: "follow",
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
  const uniqueStores = [
    ...new Set(storeNames.map((name) => name.trim()).filter(Boolean)),
  ];
  if (uniqueStores.length === 0) {
    throw new Error("店舗を1つ以上選んでください");
  }

  const result = await callGuestEyeGas({
    action: "register",
    storeNames: uniqueStores,
    staffName,
    password,
  });

  return {
    ...result,
    storeName: result.storeName || uniqueStores[0],
    staffName: result.staffName || staffName,
    stores: (result.stores as string[] | undefined) || uniqueStores,
  };
}
