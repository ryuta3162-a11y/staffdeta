"use client";

import { useMemo } from "react";
import {
  getAreas,
  getStoreNames,
  getTerritories,
  type StoreRecord,
} from "@/lib/guest-eye/stores";

interface StorePickerProps {
  stores: StoreRecord[];
  area: string;
  territory: string;
  storeName: string;
  registeredStores?: string[];
  onAreaChange: (area: string) => void;
  onTerritoryChange: (territory: string) => void;
  onStoreChange: (storeName: string) => void;
  disabled?: boolean;
}

export function StorePicker({
  stores,
  area,
  territory,
  storeName,
  registeredStores = [],
  onAreaChange,
  onTerritoryChange,
  onStoreChange,
  disabled,
}: StorePickerProps) {
  const areas = useMemo(() => getAreas(stores), [stores]);
  const territories = useMemo(
    () => (area ? getTerritories(stores, area) : []),
    [stores, area],
  );
  const storeNames = useMemo(
    () => (area && territory ? getStoreNames(stores, area, territory) : []),
    [stores, area, territory],
  );

  return (
    <div className="store-picker space-y-4">
      <label className="block">
        <span className="field-label">エリア</span>
        <select
          value={area}
          onChange={(event) => onAreaChange(event.target.value)}
          className="field-input"
          disabled={disabled}
          required
        >
          <option value="">エリアを選択</option>
          {areas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {area && (
        <label className="block">
          <span className="field-label">テリトリー</span>
          <select
            value={territory}
            onChange={(event) => onTerritoryChange(event.target.value)}
            className="field-input"
            disabled={disabled}
            required
          >
            <option value="">テリトリーを選択</option>
            {territories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      )}

      {area && territory && (
        <label className="block">
          <span className="field-label">所属店舗</span>
          <select
            value={storeName}
            onChange={(event) => onStoreChange(event.target.value)}
            className="field-input"
            disabled={disabled}
            required
          >
            <option value="">店舗を選択</option>
            {storeNames.map((item) => (
              <option key={item} value={item}>
                {item}
                {registeredStores.includes(item) ? "（登録済み）" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
