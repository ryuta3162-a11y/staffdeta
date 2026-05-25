interface GasResponse {
  success?: boolean;
  error?: string;
  storeName?: string;
  staffName?: string;
}

export async function callGas(payload: Record<string, unknown>): Promise<GasResponse> {
  const url = process.env.GAS_WEB_APP_URL;
  const secret = process.env.GAS_API_SECRET;

  if (!url || !secret) {
    throw new Error("GAS_WEB_APP_URL または GAS_API_SECRET が設定されていません");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret }),
    cache: "no-store",
    redirect: "follow",
  });

  const text = await response.text();
  let data: GasResponse;
  try {
    data = JSON.parse(text) as GasResponse;
  } catch {
    throw new Error("GAS からの応答を読み取れませんでした。Webアプリの再デプロイを確認してください");
  }
  if (!response.ok || data.error) {
    throw new Error(data.error || "GAS との通信に失敗しました");
  }

  return data;
}
