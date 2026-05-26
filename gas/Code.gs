/**
 * ナイスプレーシェア - Google Apps Script バックエンド
 * スプレッドシート・Drive への読み書きを担当
 */

const CONFIG = {
  REPORT_SHEET: "シート1",
  STAFF_SHEET: "スタッフ",
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
  return ContentService.createTextOutput("Nice Place Share API is running.");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    verifySecret_(data.secret);

    switch (data.action) {
      case "setup":
        return jsonResponse_(setupSheets_());
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

function getReportSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(CONFIG.REPORT_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.REPORT_SHEET);
  }
  return sheet;
}

function getStaffSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(CONFIG.STAFF_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.STAFF_SHEET);
  }
  return sheet;
}

function setupSheets_() {
  const reportSheet = getReportSheet_();
  if (reportSheet.getLastRow() === 0) {
    reportSheet
      .getRange(1, 1, 1, 6)
      .setValues([["店舗名", "名前", "所感", "写真", "", "送信日時"]]);
  }

  const staffSheet = getStaffSheet_();
  if (staffSheet.getLastRow() === 0) {
    staffSheet
      .getRange(1, 1, 1, 4)
      .setValues([["店舗名", "名前", "パスワード", "登録日時"]]);
  }

  return { success: true };
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

  const staffSheet = getStaffSheet_();
  staffSheet.appendRow([
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

  let photoUrl = "";
  if (data.photoBase64 && data.photoMimeType) {
    photoUrl = uploadPhoto_(
      data.photoBase64,
      data.photoMimeType,
      data.photoFileName || "photo.jpg",
      storeName,
      staffName,
    );
  }

  getReportSheet_().appendRow([
    storeName,
    staffName,
    impression,
    photoUrl,
    "",
    formatNow_(),
  ]);

  return { success: true };
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
