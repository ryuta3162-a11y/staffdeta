# ナイスプレーシェア

---

## 今やること（チェックリスト）

### ✅ 1. GAS デプロイ — 完了

この URL が表示されれば OK：
`https://script.google.com/macros/s/AKfycbxw23QJgDZG2DbJHpa_ri9Zu6redaE8Rp1rl1LmrViRnPiLhsyyvDn2JcBwWniwctzGug/exec`

---

### ☐ 2. GAS に秘密の設定を2つ入れる（3分）

Apps Script 画面で：

1. 左の **⚙ プロジェクトの設定** をクリック
2. 下にスクロール → **スクリプト プロパティ**
3. **プロパティを追加** で次の2つを入れる

| プロパティ | 値（例） |
|-----------|----------|
| `API_SECRET` | `nps-secret-2024`（好きな文字列でOK） |
| `DRIVE_FOLDER_ID` | 下の手順4で取得 |

※ ここを設定しないと、ログイン・送信が動きません。

---

### ☐ 3. スプレッドシートに「スタッフ」タブを追加

1. スプレッドシートを開く
2. 下の **＋** で新しいシートを追加
3. シート名を **`スタッフ`** に変更

（1枚目のタブ名を **「所感」** に変更してください）

---

### ☐ 4. 写真用フォルダを Drive に作る

1. Google Drive でフォルダを新規作成（名前例：`ナイスプレーシェア写真`）
2. フォルダを開いた URL から ID をコピー

```
https://drive.google.com/drive/folders/【ここがDRIVE_FOLDER_ID】
```

3. 手順2の `DRIVE_FOLDER_ID` に貼り付け

---

### ☐ 5. Vercel にデプロイ

1. このリポジトリを GitHub に push
2. [vercel.com](https://vercel.com/) → **Add New Project** → リポジトリを選ぶ
3. **Environment Variables** に以下3つを追加：

| 名前 | 値 |
|------|-----|
| `SESSION_SECRET` | `abcdef1234567890abcdef1234567890`（32文字以上） |
| `GAS_WEB_APP_URL` | `https://script.google.com/macros/s/AKfycbxw23QJgDZG2DbJHpa_ri9Zu6redaE8Rp1rl1LmrViRnPiLhsyyvDn2JcBwWniwctzGug/exec` |
| `GAS_API_SECRET` | 手順2と **同じ値**（例：`nps-secret-2024`） |

4. **Deploy** をクリック

---

### ☐ 6. 動作確認

1. Vercel の URL を開く（例：`https://staffdeta.vercel.app`）
2. **新規登録** → 店舗名・名前・パスワードを入力
3. 所感・文面を書いて **送信**
4. スプレッドシート「所感」タブに1行追加されていれば成功

---

## 全体の流れ（イメージ）

```
スタッフ → Vercel の画面 → GAS → スプレッドシート
                              ↘ Drive（写真）
管理者 → スプレッドシートを見る
```

| ツール | 何をする |
|--------|----------|
| **Vercel** | スタッフが使う画面 |
| **GAS** | スプレッドシートに書き込む |
| **GitHub** | コードの変更管理 |

---

## うまくいかないとき

| 症状 | 確認すること |
|------|-------------|
| 登録・送信でエラー | GAS の `API_SECRET` と Vercel の `GAS_API_SECRET` が **同じか** |
| 写真が保存されない | `DRIVE_FOLDER_ID` が正しいか |
| スタッフ登録できない | スプレッドシートに **「スタッフ」** タブがあるか |
| GAS をコード変更した | **デプロイ → 新しいデプロイ** をもう一度 |

---

## ファイル構成

```
gas/Code.gs     ← スプレッドシート連携（GAS に貼ったコード）
src/            ← 画面（Vercel が表示）
```

## コードを変更したとき

- **画面を変えた** → GitHub に push → Vercel が自動更新
- **GAS を変えた** → Apps Script に貼る → **新しいデプロイ**
