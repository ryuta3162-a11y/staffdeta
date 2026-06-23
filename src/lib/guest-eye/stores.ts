export interface StoreRecord {
  area: string;
  territory: string;
  storeName: string;
}

/** 社員向けプログラム（店舗データ・スタッフ登録と同じ名称） */
export const EMPLOYEE_PROGRAM_STORE = "社員向けプログラム";

export function isEmployeeProgramName(name: string): boolean {
  return name === EMPLOYEE_PROGRAM_STORE;
}

export function isEmployeeProgramArea(area: string): boolean {
  return area === EMPLOYEE_PROGRAM_STORE;
}

export function areaPickerSectionTitle(area: string): string {
  if (isEmployeeProgramArea(area)) {
    return "社員向けプログラムを追加";
  }
  return `${area} の店舗`;
}

export function formatRegistrationSummary(selectedStores: string[]): string {
  if (selectedStores.length === 0) {
    return "まだ選択されていません";
  }

  const storeCount = selectedStores.filter((name) => !isEmployeeProgramName(name))
    .length;
  const hasProgram = selectedStores.some(isEmployeeProgramName);

  if (storeCount === 0 && hasProgram) {
    return "社員向けプログラムを追加します";
  }
  if (storeCount > 0 && hasProgram) {
    const storePart = storeCount === 1 ? "1店舗" : `${storeCount}店舗`;
    return `${storePart}・社員向けプログラムで登録します`;
  }
  if (storeCount === 1) {
    return "1店舗で登録します";
  }
  return `${storeCount}店舗で登録します`;
}

export function storeKey(store: StoreRecord): string {
  return `${store.area}::${store.territory}::${store.storeName}`;
}

export function storeNameFromKey(key: string): string {
  const parts = key.split("::");
  return parts.slice(2).join("::");
}

export function territoryKey(area: string, territory: string): string {
  return `${area}::${territory}`;
}

export function parseTerritoryKey(key: string): { area: string; territory: string } {
  const [area, territory] = key.split("::");
  return { area: area || "", territory: territory || "" };
}

export function getAreas(stores: StoreRecord[]): string[] {
  return [...new Set(stores.map((store) => store.area))];
}

export function getTerritories(stores: StoreRecord[], area: string): string[] {
  return [
    ...new Set(
      stores.filter((store) => store.area === area).map((store) => store.territory),
    ),
  ];
}

export function getStoreNames(
  stores: StoreRecord[],
  area: string,
  territory: string,
): string[] {
  return stores
    .filter((store) => store.area === area && store.territory === territory)
    .map((store) => store.storeName);
}

export function filterStores(
  stores: StoreRecord[],
  selectedAreas: Set<string>,
  selectedTerritories: Set<string>,
): StoreRecord[] {
  return stores.filter(
    (store) =>
      selectedAreas.has(store.area) &&
      selectedTerritories.has(territoryKey(store.area, store.territory)),
  );
}

export function findStoresByNames(
  stores: StoreRecord[],
  storeNames: string[],
): StoreRecord[] {
  const wanted = new Set(storeNames);
  return stores.filter((store) => wanted.has(store.storeName));
}

export function groupStoresByArea(stores: StoreRecord[]): Map<string, StoreRecord[]> {
  const grouped = new Map<string, StoreRecord[]>();
  for (const store of stores) {
    const list = grouped.get(store.area) || [];
    list.push(store);
    grouped.set(store.area, list);
  }
  return grouped;
}
