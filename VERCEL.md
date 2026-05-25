# Vercel デプロイ手順（コピペ用）

GAS の設定が終わったら、あとは Vercel だけです。

---

## 手順 1：Vercel を開く

1. [https://vercel.com](https://vercel.com) を開く
2. Google または GitHub アカウントでログイン

---

## 手順 2：GitHub リポジトリをインポート

1. **Add New…** → **Project**
2. **Import Git Repository** から `staffdeta` を選ぶ  
   （リポジトリ：`ryuta3162-a11y/staffdeta`）
3. 設定はそのままで OK（Framework: Next.js と自動認識される）

---

## 手順 3：環境変数を3つ入れる

**Environment Variables** の欄で、以下を **1つずつ** 追加してください。

### ① SESSION_SECRET

| Name | Value |
|------|-------|
| `SESSION_SECRET` | `nps-session-abcdef1234567890abcdef12` |

### ② GAS_WEB_APP_URL

| Name | Value |
|------|-------|
| `GAS_WEB_APP_URL` | `https://script.google.com/macros/s/AKfycbxw23QJgDZG2DbJHpa_ri9Zu6redaE8Rp1rl1LmrViRnPiLhsyyvDn2JcBwWniwctzGug/exec` |

### ③ GAS_API_SECRET

| Name | Value |
|------|-------|
| `GAS_API_SECRET` | `nps-secret-2024` |

※ `GAS_API_SECRET` は GAS の Script Properties の `API_SECRET` と **同じ値** です。

---

## 手順 4：Deploy

1. **Deploy** ボタンをクリック
2. 1〜2分待つ
3. **Visit** または表示された URL をクリック

例：`https://staffdeta.vercel.app` のような URL が表示されます。

---

## 手順 5：動作確認

1. 開いた URL で **新規登録**
2. 店舗名・名前・パスワードを入力
3. 所感・文面を書いて **送信**
4. スプレッドシート「シート1」に1行増えていれば成功

---

## スタッフへの共有

Vercel の URL だけ渡せば OK です。

```
例：https://staffdeta.vercel.app
```

スプレッドシートの URL は渡さないでください（管理者だけが見る）。

---

## うまくいかないとき

| エラー | 対処 |
|--------|------|
| 登録・送信で失敗 | Vercel の `GAS_API_SECRET` が `nps-secret-2024` か確認 |
| GAS との通信エラー | `GAS_WEB_APP_URL` が `/exec` で終わっているか確認 |
| 写真が保存されない | GAS の `DRIVE_FOLDER_ID` が保存されているか確認 |

---

## あとから環境変数を変える場合

Vercel ダッシュボード → プロジェクト → **Settings** → **Environment Variables** → 編集 → **Redeploy**
