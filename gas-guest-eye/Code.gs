/**
 * ゲストアイ - Google Apps Script バックエンド
 *
 * スプレッドシートの1行目（ヘッダー）は管理者が手動で設定済みである前提。
 * 所感: A店舗名 B名前 C所感 D〜H写真1〜5 I健康・達成感 J送信日時
 * スタッフ: A店舗名（複数は「, 」区切り） B名前 Cパスワード D登録日時
 * 店舗データ: Aエリア Bテリトリー C店舗名
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
        return jsonResponse_({ success: true });
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
  const storeNames = normalizeStoreNames_(data);
  const staffName = String(data.staffName || "").trim();
  let password = String(data.password || "");

  if (storeNames.length === 0 || !staffName) {
    throw new Error("店舗名と名前を入力してください");
  }

  for (var i = 0; i < storeNames.length; i++) {
    validateStoreName_(storeNames[i]);
  }

  if (password.length < 6) {
    const profile = getStaffProfileByName_(staffName);
    const savedPlain = profile ? getPlainPassword_(profile.passwordHash) : "";
    if (savedPlain) {
      password = savedPlain;
    } else {
      throw new Error("パスワードは6文字以上で入力してください");
    }
  }

  var profile = getStaffProfileByName_(staffName);
  var mergedStores = mergeStoreNames_(
    profile ? profile.storeNames : [],
    storeNames,
  );

  if (!profile) {
    getStaffSheet_().appendRow([
      formatStoreNames_(mergedStores),
      staffName,
      password,
      formatNow_(),
    ]);
  } else {
    var targetRow = findStaffSetupRow_(staffName);
    var rowIndex = targetRow ? targetRow.rowIndex : profile.rowIndex;
    updateStaffProfileRow_(rowIndex, mergedStores, staffName, password);
    consolidateStaffRows_(staffName);
  }

  return {
    success: true,
    storeName: mergedStores[0] || "",
    staffName: staffName,
    stores: mergedStores,
  };
}

function normalizeStoreNames_(data) {
  var names = [];
  if (data.storeNames && data.storeNames.length) {
    names = data.storeNames;
  } else if (data.storeName) {
    names = [data.storeName];
  }

  var seen = {};
  var unique = [];
  for (var i = 0; i < names.length; i++) {
    var name = String(names[i] || "").trim();
    if (!name || seen[name]) {
      continue;
    }
    seen[name] = true;
    unique.push(name);
  }
  return unique;
}

function loginStaff_(data) {
  const storeName = String(data.storeName || "").trim();
  const staffName = String(data.staffName || "").trim();
  const password = String(data.password || "");

  validateStoreName_(storeName);

  consolidateStaffRows_(staffName);
  const profile = getStaffProfileByName_(staffName);
  if (!profile || profile.storeNames.indexOf(storeName) === -1) {
    throw new Error("店舗名・名前・パスワードが正しくありません");
  }

  const storedPassword = String(profile.passwordHash || "").trim();
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
    storeName: storeName,
    staffName: profile.staffName,
    stores: profile.storeNames,
  };
}

function lookupStaff_(data) {
  const staffName = String(data.staffName || "").trim();
  if (!staffName) {
    throw new Error("名前を入力してください");
  }

  consolidateStaffRows_(staffName);
  const profile = getStaffProfileByName_(staffName);
  if (!profile) {
    return { success: true, status: "new" };
  }

  const hasStores = profile.storeNames.length > 0;
  const hasPassword = String(profile.passwordHash || "").trim().length > 0;

  if (hasStores && hasPassword) {
    return {
      success: true,
      status: "existing",
      stores: profile.storeNames,
    };
  }

  const savedPassword = getPlainPassword_(profile.passwordHash);
  const needsStore = !hasStores && hasPassword;
  const needsPassword = !hasPassword;

  if (needsStore && savedPassword) {
    return {
      success: true,
      status: "needsStore",
      message: "所属店舗を選択してください",
      savedPassword: savedPassword,
    };
  }

  if (needsPassword) {
    return {
      success: true,
      status: "needsSetup",
      message: "恐れ入りますが、所属店舗とパスワードを入力してください",
      savedPassword: savedPassword || "",
    };
  }

  return {
    success: true,
    status: "needsStore",
    message: "所属店舗を選択してください",
    savedPassword: savedPassword || "",
  };
}

function findSavedPlainPassword_(rows) {
  for (var i = 0; i < rows.length; i++) {
    var plain = getPlainPassword_(rows[i].passwordHash);
    if (plain) {
      return plain;
    }
  }
  return "";
}

function getPlainPassword_(stored) {
  stored = String(stored || "").trim();
  if (!stored || stored.indexOf(":") !== -1) {
    return "";
  }
  return stored;
}

function getStoreData_() {
  const sheet = getSheetByName_(CONFIG.STORE_DATA_SHEET);

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
  const profile = getStaffProfileByName_(staffName);
  if (!profile || profile.storeNames.indexOf(storeName) === -1) {
    return null;
  }
  return {
    rowIndex: profile.rowIndex,
    storeName: storeName,
    staffName: profile.staffName,
    passwordHash: profile.passwordHash,
    storeNames: profile.storeNames,
  };
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
    const storeCell = String(staffSheet.getRange(row, 1).getValue() || "").trim();
    rows.push({
      rowIndex: row,
      storeName: storeCell,
      storeNames: parseStoreNames_(storeCell),
      staffName: rowName,
      passwordHash: String(staffSheet.getRange(row, 3).getValue() || ""),
    });
  }

  return rows;
}

function getStaffProfileByName_(staffName) {
  const rows = findStaffRowsByName_(staffName);
  if (rows.length === 0) {
    return null;
  }

  var allStores = [];
  var seen = {};
  var passwordHash = "";
  var primaryRowIndex = rows[0].rowIndex;

  for (var i = 0; i < rows.length; i++) {
    if (rows[i].rowIndex < primaryRowIndex) {
      primaryRowIndex = rows[i].rowIndex;
    }
    for (var j = 0; j < rows[i].storeNames.length; j++) {
      var store = rows[i].storeNames[j];
      if (!seen[store]) {
        seen[store] = true;
        allStores.push(store);
      }
    }
    if (!passwordHash && String(rows[i].passwordHash || "").trim()) {
      passwordHash = String(rows[i].passwordHash || "").trim();
    }
  }

  return {
    rowIndex: primaryRowIndex,
    staffName: normalizeStaffName_(staffName),
    storeNames: allStores,
    storeName: formatStoreNames_(allStores),
    passwordHash: passwordHash,
  };
}

function consolidateStaffRows_(staffName) {
  const rows = findStaffRowsByName_(staffName);
  if (rows.length <= 1) {
    return getStaffProfileByName_(staffName);
  }

  const profile = getStaffProfileByName_(staffName);
  if (!profile) {
    return null;
  }

  updateStaffProfileRow_(
    profile.rowIndex,
    profile.storeNames,
    profile.staffName,
    profile.passwordHash || "",
  );

  const staffSheet = getStaffSheet_();
  var toDelete = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].rowIndex !== profile.rowIndex) {
      toDelete.push(rows[i].rowIndex);
    }
  }
  toDelete.sort(function (a, b) {
    return b - a;
  });
  for (var d = 0; d < toDelete.length; d++) {
    staffSheet.deleteRow(toDelete[d]);
  }

  return getStaffProfileByName_(staffName);
}

function parseStoreNames_(value) {
  var text = String(value || "").trim();
  if (!text) {
    return [];
  }

  var parts = text.split(/[,、\n]/);
  var seen = {};
  var result = [];
  for (var i = 0; i < parts.length; i++) {
    var name = String(parts[i] || "").trim();
    if (name && !seen[name]) {
      seen[name] = true;
      result.push(name);
    }
  }
  return result;
}

function formatStoreNames_(storeNames) {
  return storeNames.join(", ");
}

function mergeStoreNames_(existingNames, newNames) {
  var merged = (existingNames || []).slice();
  for (var i = 0; i < newNames.length; i++) {
    if (merged.indexOf(newNames[i]) === -1) {
      merged.push(newNames[i]);
    }
  }
  return merged;
}

function findStaffSetupRow_(staffName) {
  const rows = findStaffRowsByName_(staffName);
  const candidates = rows.filter(function (row) {
    return (
      row.storeNames.length === 0 || !String(row.passwordHash || "").trim()
    );
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates[candidates.length - 1];
}

function updateStaffProfileRow_(rowIndex, storeNames, staffName, password) {
  const staffSheet = getStaffSheet_();
  const actualName = normalizeStaffName_(staffSheet.getRange(rowIndex, 2).getValue());
  if (actualName !== normalizeStaffName_(staffName)) {
    throw new Error("登録先の行が一致しません。管理者にお問い合わせください。");
  }

  staffSheet.getRange(rowIndex, 1).setValue(formatStoreNames_(storeNames));
  staffSheet.getRange(rowIndex, 3).setValue(password);

  const registeredAt = String(staffSheet.getRange(rowIndex, 4).getValue() || "").trim();
  if (!registeredAt) {
    staffSheet.getRange(rowIndex, 4).setValue(formatNow_());
  }
}

function updateStaffRow_(rowIndex, storeName, staffName, password) {
  updateStaffProfileRow_(rowIndex, [storeName], staffName, password);
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
