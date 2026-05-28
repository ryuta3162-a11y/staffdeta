# ゲストアイ セットアップ手順

**ナイスプレーシェアとは別の Vercel プロジェクト** で公開します。

| アプリ | URL（例） |
|--------|-----------|
| ナイスプレーシェア | https://nps-share.vercel.app |
| **ゲストアイ** | **https://guest-eye.vercel.app** |

同じ GitHub リポジトリ（`staffdeta`）を、Vercel に **2回 Import** します。

---

## 用意済みのリンク

| 用途 | URL |
|------|-----|
| **スプレッドシート** | https://docs.google.com/spreadsheets/d/1-OWf--m_pNq6KejbIsACHB5JcnukP5YTO_CXWtZzjtg/edit |
| **写真フォルダ** | https://drive.google.com/drive/folders/1GKZ-45YtykbXUkazUya--hMBoSs45wmC |
| **GAS** | https://script.google.com/macros/s/AKfycbyQ64fqP0qcf_lO41084Zhz9SqaMiZlnemEbIN5OsBJOo1iL8C7l-wYEzeIX6UdtF5U/exec |

---

## ☐ 1. GAS（済ならスキップ）

1. [スプレッドシート](https://docs.google.com/spreadsheets/d/1-OWf--m_pNq6KejbIsACHB5JcnukP5YTO_CXWtZzjtg/edit) → **拡張機能 → Apps Script**
2. `gas-guest-eye/Code.gs` を貼り付け
3. **スクリプト プロパティ**：

| プロパティ | 値 |
|-----------|-----|
| `API_SECRET` | `guest-eye-secret-2024` |
| `DRIVE_FOLDER_ID` | `1GKZ-45YtykbXUkazUya--hMBoSs45wmC` |

4. タブ名：**所感** / **スタッフ**

---

## ☐ 2. Vercel に **新しいプロジェクト** を作る

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. 同じ **`staffdeta`** リポジトリを選ぶ → **Import**
3. **Project Name** を **`guest-eye`** に変更  
   → URL が `https://guest-eye.vercel.app` になる

### 環境変数（5つ）

| Name | Value |
|------|-------|
| `APP_MODE` | `guest-eye` |
| `NEXT_PUBLIC_APP_MODE` | `guest-eye` |
| `SESSION_SECRET` | `nps-session-abcdef1234567890abcdef12`（NPSと同じでOK） |
| `GUEST_EYE_GAS_WEB_APP_URL` | `https://script.google.com/macros/s/AKfycbyQ64fqP0qcf_lO41084Zhz9SqaMiZlnemEbIN5OsBJOo1iL8C7l-wYEzeIX6UdtF5U/exec` |
| `GUEST_EYE_GAS_API_SECRET` | `guest-eye-secret-2024` |

※ **NPS 用**（`GAS_WEB_APP_URL` など）は **入れなくてOK**

4. **Deploy**

---

## ☐ 3. 動作確認

1. https://guest-eye.vercel.app を開く  
   → ゲストアイのログイン画面（URL は `/login` のまま）
2. 店舗名・名前で登録 → 所感を送信
3. [スプレッドシート](https://docs.google.com/spreadsheets/d/1-OWf--m_pNq6KejbIsACHB5JcnukP5YTO_CXWtZzjtg/edit) に反映

---

## スタッフに渡す URL

```
https://guest-eye.vercel.app
```

ナイスプレーシェア（https://nps-share.vercel.app）とは **別URL** です。

---

## ファイル構成

```
gas-guest-eye/Code.gs     ゲストアイ用 GAS
gas/Code.gs               ナイスプレーシェア用 GAS（別）
src/middleware.ts         APP_MODE=guest-eye 時にゲストアイへ誘導
```
