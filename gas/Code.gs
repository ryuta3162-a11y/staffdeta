/**
 * ナイスプレーシェア - Google Apps Script バックエンド
 * （ゲストアイ用は gas-guest-eye/Code.gs を使用）
 *
 * スプレッドシートの1行目（ヘッダー）は管理者が手動で設定済みである前提。
 * 所感: A店舗名 B名前 C所感 D〜H写真1〜5 I送信日時
 * スタッフ: A店舗名 B名前 Cパスワード D登録日時
 */

const CONFIG = {
  REPORT_SHEET: "所感",
  STAFF_SHEET: "スタッフ",
  MAX_PHOTO_COLUMNS: 5,
};

const STORES = [
  "洗足",
  "目黒",
  "上馬",
  "桜新町",
  "青葉台",
  "FIT365京王堀之内",
  "京王稲田堤",
  "読売ランド前",
  "向ヶ丘遊園",
  "FIT365稲城",
  "分倍河原",
  "立川",
  "高幡不動",
  "武蔵小金井",
  "FIT365立川柏町",
];

function doGet() {
  return ContentService.createTextOutput("Nice Play Share API is running.");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    verifySecret_(data.secret);

    switch (data.action) {
      case "setup":
        return jsonResponse_({ success: true });
      case "register":
        return jsonResponse_(registerStaff_(data));
      case "login":
        return jsonResponse_(loginStaff_(data));
      case "submit":
        return jsonResponse_(submitReport_(data));
      default:
        throw new Error("不明な action です");
    }
  } catch (error) {
    return jsonResponse_({ error: error.message || "エラーが発生しました" });
  }
}

function verifySecret_(secret) {
  const expected = PropertiesService.getScriptProperties().getProperty("API_SECRET");
  if (!expected || secret !== expected) {
    throw new Error("認証に失敗しました");
  }
}

function isValidStore_(storeName) {
  return STORES.indexOf(storeName) !== -1;
}

function validateStore_(storeName) {
  if (!isValidStore_(storeName)) {
    throw new Error("選択できない店舗です");
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheetByName_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("シート「" + sheetName + "」が見つかりません");
  }
  return sheet;
}

function getReportSheet_() {
  return getSheetByName_(CONFIG.REPORT_SHEET);
}

function getStaffSheet_() {
  return getSheetByName_(CONFIG.STAFF_SHEET);
}

function registerStaff_(data) {
  const storeName = String(data.storeName || "").trim();
  const staffName = String(data.staffName || "").trim();
  const password = String(data.password || "");

  if (!storeName || !staffName) {
    throw new Error("店舗名と名前を入力してください");
  }
  validateStore_(storeName);
  if (password.length < 6) {
    throw new Error("パスワードは6文字以上で入力してください");
  }

  if (findStaffRow_(storeName, staffName)) {
    throw new Error("この店舗名・名前の組み合わせは既に登録されています");
  }

  getStaffSheet_().appendRow([
    storeName,
    staffName,
    hashPassword_(password),
    formatNow_(),
  ]);

  return {
    success: true,
    storeName: storeName,
    staffName: staffName,
  };
}

function loginStaff_(data) {
  const storeName = String(data.storeName || "").trim();
  const staffName = String(data.staffName || "").trim();
  const password = String(data.password || "");

  validateStore_(storeName);

  const row = findStaffRow_(storeName, staffName);
  if (!row) {
    throw new Error("店舗名・名前・パスワードが正しくありません");
  }

  const storedHash = String(row.passwordHash || "");
  if (!verifyPassword_(password, storedHash)) {
    throw new Error("店舗名・名前・パスワードが正しくありません");
  }

  return {
    success: true,
    storeName: row.storeName,
    staffName: row.staffName,
  };
}

function submitReport_(data) {
  const storeName = String(data.storeName || "").trim();
  const staffName = String(data.staffName || "").trim();
  const impression = String(
    data.impression || data.report || data.message || "",
  ).trim();

  if (!storeName || !staffName) {
    throw new Error("ログイン情報が不足しています");
  }
  validateStore_(storeName);
  if (!impression) {
    throw new Error("所感を入力してください");
  }

  var photoUrls = collectPhotoUrls_(data, storeName, staffName);

  getReportSheet_().appendRow([
    storeName,
    staffName,
    impression,
    photoUrls[0],
    photoUrls[1],
    photoUrls[2],
    photoUrls[3],
    photoUrls[4],
    formatNow_(),
  ]);

  return { success: true };
}

function collectPhotoUrls_(data, storeName, staffName) {
  var urls = ["", "", "", "", ""];
  var maxPhotos = CONFIG.MAX_PHOTO_COLUMNS;

  if (data.photos && data.photos.length) {
    for (var i = 0; i < data.photos.length && i < maxPhotos; i++) {
      var photo = data.photos[i];
      urls[i] = uploadPhoto_(
        photo.photoBase64,
        photo.photoMimeType,
        photo.photoFileName || "photo" + (i + 1) + ".jpg",
        storeName,
        staffName,
      );
    }
  } else if (data.photoBase64 && data.photoMimeType) {
    urls[0] = uploadPhoto_(
      data.photoBase64,
      data.photoMimeType,
      data.photoFileName || "photo.jpg",
      storeName,
      staffName,
    );
  }

  return urls;
}

function findStaffRow_(storeName, staffName) {
  const staffSheet = getStaffSheet_();
  const values = staffSheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const rowStore = String(values[i][0] || "").trim();
    const rowName = String(values[i][1] || "").trim();
    if (rowStore === storeName && rowName === staffName) {
      return {
        rowIndex: i + 1,
        storeName: rowStore,
        staffName: rowName,
        passwordHash: String(values[i][2] || ""),
      };
    }
  }

  return null;
}

function hashPassword_(password) {
  const salt = Utilities.getUuid();
  const hash = computeHash_(salt + password);
  return salt + ":" + hash;
}

function verifyPassword_(password, stored) {
  const parts = String(stored).split(":");
  if (parts.length !== 2) {
    return false;
  }
  const expected = computeHash_(parts[0] + password);
  return expected === parts[1];
}

function computeHash_(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8,
  );
  return digest
    .map(function (byte) {
      const v = byte < 0 ? byte + 256 : byte;
      return ("0" + v.toString(16)).slice(-2);
    })
    .join("");
}

function uploadPhoto_(base64Data, mimeType, fileName, storeName, staffName) {
  const folderId = PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID");
  if (!folderId) {
    throw new Error("DRIVE_FOLDER_ID が Script Properties に設定されていません");
  }

  const folder = DriveApp.getFolderById(folderId);
  const safeStore = storeName.replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF-]/g, "");
  const safeName = staffName.replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF-]/g, "");
  const timestamp = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyyMMdd-HHmmss");
  const finalName = safeStore + "_" + safeName + "_" + timestamp + "_" + fileName;

  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType,
    finalName,
  );
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function formatNow_() {
  return Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
