# ゲストアイ セットアップ手順

週1回ジムを利用する方向けのアプリです。  
**ナイスプレーシェアとは別のスプレッドシート・GAS を使います。**

---

## ファイル構成

```
gas/                 ナイスプレーシェア用 GAS
gas-guest-eye/       ゲストアイ用 GAS  ← こちら
src/app/guest-eye/   ゲストアイ画面・API
```

---

## 1. スプレッドシートを新規作成

1. Google スプレッドシートを **新規作成**（ナイスプレーシェアとは別）
2. 1枚目のタブ名を **`所感`** に変更
3. 2枚目のタブ **`スタッフ`** を追加

---

## 2. GAS を設定

1. 新しいスプレッドシートで **拡張機能 → Apps Script**
2. `gas-guest-eye/Code.gs` の内容を貼り付け
3. **スクリプト プロパティ** に追加：

| キー | 値 |
|------|-----|
| `API_SECRET` | ランダム文字列 |
| `DRIVE_FOLDER_ID` | 写真用 Drive フォルダ ID |

4. **デプロイ → 新しいデプロイ → ウェブアプリ**
5. URL（`/exec`）をコピー

---

## 3. Vercel 環境変数

| 名前 | 値 |
|------|-----|
| `GUEST_EYE_GAS_WEB_APP_URL` | 手順2の URL |
| `GUEST_EYE_GAS_API_SECRET` | GAS の `API_SECRET` と同じ |

※ `SESSION_SECRET` はナイスプレーシェアと共通で OK

---

## 4. URL

| アプリ | URL |
|--------|-----|
| ナイスプレーシェア | `https://あなたのドメイン/` |
| **ゲストアイ** | `https://あなたのドメイン/guest-eye` |

---

## 5. 動作確認

1. `/guest-eye` を開く
2. 店舗を選んで新規登録
3. 所感を送信
4. ゲストアイ用スプレッドシート「所感」タブに反映されていれば成功

---

## clasp（任意）

```bash
cp .clasp.guest-eye.json.example .clasp.guest-eye.json
# Script ID を設定
npx clasp push --project .clasp.guest-eye.json
```
