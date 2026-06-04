export interface StoreRecord {
  area: string;
  territory: string;
  storeName: string;
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
