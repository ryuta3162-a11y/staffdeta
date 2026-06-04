"use client";

import { useEffect, useMemo, useState } from "react";
import {
  filterStores,
  getAreas,
  getTerritories,
  groupStoresByArea,
  territoryKey,
  type StoreRecord,
} from "@/lib/guest-eye/stores";

interface StorePickerProps {
  stores: StoreRecord[];
  storeName: string;
  registeredStores?: string[];
  onStoreChange: (storeName: string) => void;
  disabled?: boolean;
}

export function StorePicker({
  stores,
  storeName,
  registeredStores = [],
  onStoreChange,
  disabled,
}: StorePickerProps) {
  const areas = useMemo(() => getAreas(stores), [stores]);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [selectedTerritories, setSelectedTerritories] = useState<Set<string>>(new Set());
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set());

  const visibleStores = useMemo(
    () => filterStores(stores, selectedAreas, selectedTerritories),
    [stores, selectedAreas, selectedTerritories],
  );

  const visibleStoreNames = useMemo(
    () => new Set(visibleStores.map((store) => store.storeName)),
    [visibleStores],
  );

  const groupedStores = useMemo(() => groupStoresByArea(visibleStores), [visibleStores]);

  useEffect(() => {
    if (storeName && !visibleStoreNames.has(storeName)) {
      onStoreChange("");
    }
  }, [storeName, visibleStoreNames, onStoreChange]);

  function toggleArea(area: string) {
    if (disabled) {
      return;
    }

    setSelectedAreas((current) => {
      const next = new Set(current);
      if (next.has(area)) {
        next.delete(area);
        setSelectedTerritories((territories) => {
          const updated = new Set(territories);
          for (const key of updated) {
            if (key.startsWith(`${area}::`)) {
              updated.delete(key);
            }
          }
          return updated;
        });
        setOpenAreas((open) => {
          const updated = new Set(open);
          updated.delete(area);
          return updated;
        });
      } else {
        next.add(area);
        setSelectedTerritories((territories) => {
          const updated = new Set(territories);
          for (const territory of getTerritories(stores, area)) {
            updated.add(territoryKey(area, territory));
          }
          return updated;
        });
        setOpenAreas((open) => new Set(open).add(area));
      }
      return next;
    });
    onStoreChange("");
  }

  function toggleTerritory(area: string, territory: string) {
    if (disabled) {
      return;
    }

    const key = territoryKey(area, territory);
    setSelectedTerritories((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    onStoreChange("");
  }

  function toggleAreaPanel(area: string) {
    setOpenAreas((current) => {
      const next = new Set(current);
      if (next.has(area)) {
        next.delete(area);
      } else {
        next.add(area);
      }
      return next;
    });
  }

  const territoryCount = selectedTerritories.size;

  return (
    <div className="store-filter space-y-5">
      <div className="store-filter-progress">
        <span>エリア {selectedAreas.size}</span>
        <span>テリトリー {territoryCount}</span>
        <span>店舗 {visibleStores.length}件</span>
        <span>{storeName ? "選択済み" : "未選択"}</span>
      </div>

      <section>
        <h3 className="store-filter-title">エリア（複数選択可）</h3>
        <div className="store-filter-chips">
          {areas.map((area) => (
            <button
              key={area}
              type="button"
              disabled={disabled}
              className={`store-filter-chip ${selectedAreas.has(area) ? "store-filter-chip--on" : ""}`}
              onClick={() => toggleArea(area)}
            >
              {area}
            </button>
          ))}
        </div>
      </section>

      {selectedAreas.size > 0 && (
        <section>
          <h3 className="store-filter-title">テリトリー（不要なものはタップして外す）</h3>
          <div className="space-y-4">
            {[...selectedAreas].map((area) => (
              <div key={area}>
                <p className="store-filter-group-label">{area}</p>
                <div className="store-filter-chips">
                  {getTerritories(stores, area).map((territory) => {
                    const key = territoryKey(area, territory);
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        className={`store-filter-chip ${selectedTerritories.has(key) ? "store-filter-chip--on" : ""}`}
                        onClick={() => toggleTerritory(area, territory)}
                      >
                        {territory}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {visibleStores.length > 0 && (
        <section>
          <div className="store-filter-store-head">
            <h3 className="store-filter-title">所属店舗を選択</h3>
            <span className="store-filter-count">
              {storeName ? "1" : "0"}/{visibleStores.length}
            </span>
          </div>
          <p className="store-filter-hint">
            店舗が多い場合はエリアごとに開いて選択できます。
          </p>
          <div className="space-y-3">
            {[...groupedStores.entries()].map(([area, areaStores]) => (
              <div key={area} className="store-filter-accordion">
                <button
                  type="button"
                  className="store-filter-accordion-head"
                  onClick={() => toggleAreaPanel(area)}
                >
                  <span>{area} の店舗</span>
                  <span className="store-filter-count">
                    {areaStores.some((store) => store.storeName === storeName) ? 1 : 0}/
                    {areaStores.length}
                  </span>
                </button>
                {openAreas.has(area) && (
                  <div className="store-filter-chips store-filter-chips--stores">
                    {areaStores.map((store) => (
                      <button
                        key={`${area}-${store.territory}-${store.storeName}`}
                        type="button"
                        disabled={disabled}
                        className={`store-filter-chip ${storeName === store.storeName ? "store-filter-chip--on" : ""}`}
                        onClick={() => onStoreChange(store.storeName)}
                      >
                        {store.storeName}
                        {registeredStores.includes(store.storeName) ? "（登録済）" : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
