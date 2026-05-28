# ゲストアイ セットアップ手順

週1回ジムを利用する方向け。**ナイスプレーシェアとは完全に別**です。

---

## 用意済みのリンク

| 用途 | URL |
|------|-----|
| **スプレッドシート** | https://docs.google.com/spreadsheets/d/1-OWf--m_pNq6KejbIsACHB5JcnukP5YTO_CXWtZzjtg/edit |
| **写真フォルダ（Drive）** | https://drive.google.com/drive/folders/1GKZ-45YtykbXUkazUya--hMBoSs45wmC |

---

## チェックリスト

### ☐ 1. スプレッドシートのタブ

[スプレッドシート](https://docs.google.com/spreadsheets/d/1-OWf--m_pNq6KejbIsACHB5JcnukP5YTO_CXWtZzjtg/edit) を開き：

1. 1枚目のタブ名 → **`所感`**
2. 2枚目のタブを追加 → 名前 **`スタッフ`**

---

### ☐ 2. GAS を設定

1. スプレッドシートから **拡張機能 → Apps Script**
2. `gas-guest-eye/Code.gs` の内容を **すべて貼り付け**
3. **⚙ プロジェクトの設定 → スクリプト プロパティ** に追加：

| プロパティ | 値（コピペ） |
|-----------|-------------|
| `API_SECRET` | `guest-eye-secret-2024` |
| `DRIVE_FOLDER_ID` | `1GKZ-45YtykbXUkazUya--hMBoSs45wmC` |

4. **デプロイ → 新しいデプロイ → ウェブアプリ**
   - 実行ユーザー：**自分**
   - アクセス：**全員**
5. 表示された URL（`/exec` で終わる）をコピー

---

### ☐ 3. Vercel 環境変数

[Vercel ダッシュボード](https://vercel.com/) → プロジェクト → **Settings → Environment Variables**

**追加する2つ：**

| Name | Value |
|------|-------|
| `GUEST_EYE_GAS_WEB_APP_URL` | 手順2でコピーした GAS の URL |
| `GUEST_EYE_GAS_API_SECRET` | `guest-eye-secret-2024` |

※ 既にある `SESSION_SECRET` / `GAS_WEB_APP_URL` / `GAS_API_SECRET` は **ナイスプレーシェア用なので触らない**

追加後 → **Deployments → Redeploy**（再デプロイ）

---

### ☐ 4. 動作確認

1. `https://あなたのドメイン/guest-eye` を開く
2. 店舗を選んで新規登録
3. 所感を送信
4. [スプレッドシート「所感」タブ](https://docs.google.com/spreadsheets/d/1-OWf--m_pNq6KejbIsACHB5JcnukP5YTO_CXWtZzjtg/edit) に1行増えていれば成功
5. 写真は [ゲストアイ画像フォルダ](https://drive.google.com/drive/folders/1GKZ-45YtykbXUkazUya--hMBoSs45wmC) に保存される

---

## スタッフに渡す URL

```
https://あなたのドメイン/guest-eye
```

※ ナイスプレーシェア（`/`）とは別 URL です。

---

## ファイル構成（開発者向け）

```
gas-guest-eye/Code.gs     ゲストアイ用 GAS
src/app/guest-eye/        ゲストアイ画面・API
gas/Code.gs               ナイスプレーシェア用（別）
```

---

## うまくいかないとき

| 症状 | 確認 |
|------|------|
| ログイン・送信エラー | Vercel の `GUEST_EYE_GAS_API_SECRET` = `guest-eye-secret-2024` か |
| 写真が保存されない | GAS の `DRIVE_FOLDER_ID` = `1GKZ-45YtykbXUkazUya--hMBoSs45wmC` か |
| データが別シートに入る | GAS を **このスプレッドシート** に紐づけているか |
