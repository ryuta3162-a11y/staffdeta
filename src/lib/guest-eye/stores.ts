export interface StoreRecord {
  area: string;
  territory: string;
  storeName: string;
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

export function groupStoresByArea(stores: StoreRecord[]): Map<string, StoreRecord[]> {
  const grouped = new Map<string, StoreRecord[]>();
  for (const store of stores) {
    const list = grouped.get(store.area) || [];
    list.push(store);
    grouped.set(store.area, list);
  }
  return grouped;
}
