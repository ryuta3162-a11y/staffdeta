# ナイスプレーシェア（Nice Place Share）

スタッフが「所感・写真・文面」を送信し、Google スプレッドシートに自動反映する Web アプリです。

## 構成（いつもの3点セット）

| 役割 | 技術 |
|------|------|
| 画面 | **Vercel**（Next.js） |
| データ処理 | **Google Apps Script**（GAS） |
| コード管理 | **GitHub** |

```
スタッフ → Vercel（画面） → GAS（API） → スプレッドシート / Drive
管理者 → スプレッドシートで確認
```

**Google Cloud は不要です。** 完全無料で運用できます。

---

## スプレッドシート構成

### 1枚目：日報データ

| 列 | 内容 |
|----|------|
| A | 店舗名 |
| B | 名前 |
| C | 所感 |
| D | 写真（Drive リンク） |
| E | 文面 |
| F | 送信日時（自動） |

### 2枚目：スタッフ

| 列 | 内容 |
|----|------|
| A | 店舗名 |
| B | 名前 |
| C | パスワード（ハッシュ・自動） |
| D | 登録日時（自動） |

---

## セットアップ手順

### 1. スプレッドシートに GAS を紐づける

1. 対象スプレッドシートを開く  
   `https://docs.google.com/spreadsheets/d/1faW3ZeQZ-xXxGdkIESrFeHJHS6EWB1EJR-6Qgko1Q64/edit`
2. **拡張機能 → Apps Script** を開く
3. `gas/Code.gs` の内容を貼り付け（または clasp で push）
4. **プロジェクトの設定 → Script Properties** に以下を追加：

| キー | 値 |
|------|-----|
| `API_SECRET` | ランダムな文字列（Vercel 側と同じ値） |
| `DRIVE_FOLDER_ID` | 写真保存用 Drive フォルダ ID |

### 2. GAS を Web アプリとしてデプロイ

1. Apps Script 右上 **デプロイ → 新しいデプロイ**
2. 種類：**ウェブアプリ**
3. 実行ユーザー：**自分**
4. アクセス：**全員**
5. デプロイ後の URL（`/exec` で終わる）をコピー

### 3. GitHub + Vercel

1. このリポジトリを GitHub に push
2. [Vercel](https://vercel.com/) でリポジトリをインポート
3. 環境変数を設定：

| 変数名 | 値 |
|--------|-----|
| `SESSION_SECRET` | 32文字以上のランダム文字列 |
| `GAS_WEB_APP_URL` | 手順2の Web アプリ URL |
| `GAS_API_SECRET` | GAS の `API_SECRET` と同じ値 |

4. Deploy

### 4. clasp で GAS を GitHub から管理（任意）

```bash
npm install
npx clasp login
cp .clasp.json.example .clasp.json
# .clasp.json に Script ID を設定
npm run gas:push
```

GAS を変更したら `npm run gas:push` → Apps Script で **新しいデプロイ** を作成。

---

## ローカル開発

```bash
npm install
cp .env.example .env.local
# .env.local を編集
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認。

初回ヘッダー作成：`http://localhost:3000/api/setup`

---

## ファイル構成

```
gas/
  Code.gs           GAS バックエンド（スプレッドシート連携）
  appsscript.json   GAS 設定
src/
  app/              Next.js 画面・API（Vercel）
  components/       UI
  lib/gas.ts        GAS 呼び出し
```

---

## 変更の流れ

| 変更内容 | 作業 |
|----------|------|
| 画面のデザイン・文言 | GitHub に push → Vercel が自動デプロイ |
| スプレッドシート連携ロジック | `gas/Code.gs` を編集 → `clasp push` → GAS 再デプロイ |

---

## 技術スタック

- Next.js 15 + Tailwind CSS（Vercel）
- Google Apps Script（Sheets / Drive）
- iron-session（ログイン状態）
- GitHub + clasp（GAS コード管理）
