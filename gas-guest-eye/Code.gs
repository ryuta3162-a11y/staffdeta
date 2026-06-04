/**
 * ゲストアイ - Google Apps Script バックエンド
 * 週1回ジム利用者向け・スプレッドシート・Drive への読み書きを担当
 */

const CONFIG = {
  REPORT_SHEET: "所感",
  STAFF_SHEET: "スタッフ",
  STORE_DATA_SHEET: "店舗データ",
  MAX_PHOTO_COLUMNS: 5,
};

function doGet() {
  return ContentService.createTextOutput("Guest Eye API is running.");
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
      case "getStoreData":
        return jsonResponse_(getStoreData_());
      case "lookupStaff":
        return jsonResponse_(lookupStaff_(data));
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
  forceReportHeaderRow_();
  forceStaffHeaderRow_();
  return { success: true };
}

/** Apps Script エディタから1回実行 → 所感・スタッフのヘッダーを正しい形に更新 */
function setupHeadersNow() {
  setupSheets_();
}

function forceReportHeaderRow_() {
  const headers = getReportHeaders_();
  getReportSheet_().getRange(1, 1, 1, headers.length).setValues([headers]);
}

function forceStaffHeaderRow_() {
  const headers = ["店舗名", "名前", "パスワード", "登録日時"];
  getStaffSheet_().getRange(1, 1, 1, headers.length).setValues([headers]);
}

function ensureStaffHeaders_() {
  ensureSheetHeaders_(getStaffSheet_(), ["店舗名", "名前", "パスワード", "登録日時"]);
}

function getReportHeaders_() {
  return [
    "店舗名",
    "名前",
    "所感",
    "写真1",
    "写真2",
    "写真3",
    "写真4",
    "写真5",
    "健康・達成感（5段階）",
    "送信日時",
  ];
}

function ensureReportHeaders_() {
  const headers = getReportHeaders_();
  ensureSheetHeaders_(getReportSheet_(), headers);
  syncReportHeaderRow_(headers);
}

function syncReportHeaderRow_(headers) {
  const sheet = getReportSheet_();
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(current[i] || "").trim() !== headers[i]) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      return;
    }
  }
}

function ensureSheetHeaders_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  const firstCell = String(sheet.getRange(1, 1).getValue() || "").trim();
  if (firstCell !== headers[0]) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function registerStaff_(data) {
  const storeName = String(data.storeName || "").trim();
  const staffName = String(data.staffName || "").trim();
  const password = String(data.password || "");

  if (!storeName || !staffName) {
    throw new Error("店舗名と名前を入力してください");
  }
  validateStoreName_(storeName);
  if (password.length < 6) {
    throw new Error("パスワードは6文字以上で入力してください");
  }

  const setupRow = findStaffSetupRow_(staffName);
  if (setupRow) {
    ensureStaffHeaders_();
    updateStaffRow_(setupRow.rowIndex, storeName, staffName, password);
    return {
      success: true,
      storeName: storeName,
      staffName: staffName,
    };
  }

  const existing = findStaffRow_(storeName, staffName);
  if (existing) {
    const stored = String(existing.passwordHash || "").trim();
    if (!stored) {
      ensureStaffHeaders_();
      updateStaffRow_(existing.rowIndex, storeName, staffName, password);
      return {
        success: true,
        storeName: storeName,
        staffName: staffName,
      };
    }
    throw new Error("この店舗名・名前の組み合わせは既に登録されています");
  }

  ensureStaffHeaders_();
  const staffSheet = getStaffSheet_();
  staffSheet.appendRow([
    storeName,
    staffName,
    password,
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

  validateStoreName_(storeName);

  const row = findStaffRow_(storeName, staffName);
  if (!row) {
    throw new Error("店舗名・名前・パスワードが正しくありません");
  }

  const storedPassword = String(row.passwordHash || "").trim();
  if (!storedPassword) {
    throw new Error(
      "恐れ入りますが、所属店舗とパスワードを再度入力してください",
    );
  }
  if (!verifyStoredPassword_(password, storedPassword)) {
    throw new Error("店舗名・名前・パスワードが正しくありません");
  }

  return {
    success: true,
    storeName: row.storeName,
    staffName: row.staffName,
  };
}

function lookupStaff_(data) {
  const staffName = String(data.staffName || "").trim();
  if (!staffName) {
    throw new Error("名前を入力してください");
  }

  const rows = findStaffRowsByName_(staffName);
  if (rows.length === 0) {
    return { success: true, status: "new" };
  }

  const hasIncomplete = rows.some(function (row) {
    return !row.storeName || !String(row.passwordHash || "").trim();
  });

  if (hasIncomplete) {
    return {
      success: true,
      status: "needsSetup",
      message: "恐れ入りますが、所属店舗とパスワードを再度入力してください",
    };
  }

  return {
    success: true,
    status: "existing",
    stores: rows.map(function (row) {
      return row.storeName;
    }),
  };
}

function getStoreData_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.STORE_DATA_SHEET);
  if (!sheet) {
    throw new Error("店舗データシートが見つかりません");
  }

  const values = sheet.getDataRange().getValues();
  const stores = [];

  for (let i = 1; i < values.length; i++) {
    const area = String(values[i][0] || "").trim();
    const territory = String(values[i][1] || "").trim();
    const storeName = String(values[i][2] || "").trim();
    if (area && territory && storeName) {
      stores.push({
        area: area,
        territory: territory,
        storeName: storeName,
      });
    }
  }

  if (stores.length === 0) {
    throw new Error("店舗データが登録されていません");
  }

  return { success: true, stores: stores };
}

function getValidStoreNames_() {
  const result = getStoreData_();
  return result.stores.map(function (store) {
    return store.storeName;
  });
}

function validateStoreName_(storeName) {
  const validStores = getValidStoreNames_();
  if (validStores.indexOf(storeName) === -1) {
    throw new Error("店舗を一覧から選択してください");
  }
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
  if (!impression) {
    throw new Error("所感を入力してください");
  }

  const healthRating = Number(data.healthRating || 0);
  if (!healthRating || healthRating < 1 || healthRating > 5) {
    throw new Error("健康・達成感の評価を選択してください");
  }

  ensureReportHeaders_();

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
    healthRating,
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
  const rows = findStaffRowsByName_(staffName);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].storeName === storeName) {
      return rows[i];
    }
  }
  return null;
}

function findStaffRowsByName_(staffName) {
  const target = normalizeStaffName_(staffName);
  const staffSheet = getStaffSheet_();
  const lastRow = staffSheet.getLastRow();
  const rows = [];

  for (let row = 2; row <= lastRow; row++) {
    const rowName = normalizeStaffName_(staffSheet.getRange(row, 2).getValue());
    if (rowName !== target) {
      continue;
    }
    rows.push({
      rowIndex: row,
      storeName: String(staffSheet.getRange(row, 1).getValue() || "").trim(),
      staffName: rowName,
      passwordHash: String(staffSheet.getRange(row, 3).getValue() || ""),
    });
  }

  return rows;
}

function findStaffSetupRow_(staffName) {
  const rows = findStaffRowsByName_(staffName);
  const candidates = rows.filter(function (row) {
    return !row.storeName || !String(row.passwordHash || "").trim();
  });

  if (candidates.length === 0) {
    return null;
  }

  const nameOnlyRows = candidates.filter(function (row) {
    return !row.storeName;
  });
  if (nameOnlyRows.length > 0) {
    return nameOnlyRows[nameOnlyRows.length - 1];
  }

  return candidates[candidates.length - 1];
}

function updateStaffRow_(rowIndex, storeName, staffName, password) {
  const staffSheet = getStaffSheet_();
  const actualName = normalizeStaffName_(staffSheet.getRange(rowIndex, 2).getValue());
  if (actualName !== normalizeStaffName_(staffName)) {
    throw new Error("登録先の行が一致しません。管理者にお問い合わせください。");
  }

  staffSheet.getRange(rowIndex, 1).setValue(storeName);
  staffSheet.getRange(rowIndex, 3).setValue(password);

  const registeredAt = String(staffSheet.getRange(rowIndex, 4).getValue() || "").trim();
  if (!registeredAt) {
    staffSheet.getRange(rowIndex, 4).setValue(formatNow_());
  }
}

function normalizeStaffName_(name) {
  return String(name || "")
    .trim()
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ");
}

function verifyStoredPassword_(password, stored) {
  stored = String(stored || "");
  if (stored.indexOf(":") !== -1) {
    return verifyPassword_(password, stored);
  }
  return password === stored;
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
