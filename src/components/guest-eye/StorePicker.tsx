"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  filterStores,
  getAreas,
  getTerritories,
  groupStoresByArea,
  storeKey,
  territoryKey,
  type StoreRecord,
} from "@/lib/guest-eye/stores";

interface StorePickerProps {
  stores: StoreRecord[];
  selectedStores: string[];
  registeredStores?: string[];
  onStoresChange: Dispatch<SetStateAction<string[]>>;
  disabled?: boolean;
}

export function StorePicker({
  stores,
  selectedStores,
  registeredStores = [],
  onStoresChange,
  disabled,
}: StorePickerProps) {
  const areas = useMemo(() => getAreas(stores), [stores]);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [selectedTerritories, setSelectedTerritories] = useState<Set<string>>(
    new Set(),
  );
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set());

  const visibleStores = useMemo(
    () => filterStores(stores, selectedAreas, selectedTerritories),
    [stores, selectedAreas, selectedTerritories],
  );

  const visibleStoreNames = useMemo(
    () => new Set(visibleStores.map((store) => store.storeName)),
    [visibleStores],
  );

  const groupedStores = useMemo(
    () => groupStoresByArea(visibleStores),
    [visibleStores],
  );

  const selectedSet = useMemo(() => new Set(selectedStores), [selectedStores]);

  const visibleSelectedCount = useMemo(
    () => selectedStores.filter((name) => visibleStoreNames.has(name)).length,
    [selectedStores, visibleStoreNames],
  );

  useEffect(() => {
    onStoresChange((current) => {
      const next = current.filter((name) => visibleStoreNames.has(name));
      return next.length === current.length ? current : next;
    });
  }, [visibleStoreNames, onStoresChange]);

  useEffect(() => {
    if (selectedAreas.size === 0) {
      return;
    }

    setOpenAreas((current) => {
      const next = new Set(current);
      for (const area of selectedAreas) {
        next.add(area);
      }
      return next;
    });
  }, [selectedAreas]);

  function toggleStore(store: StoreRecord) {
    if (disabled) {
      return;
    }

    const name = store.storeName;
    onStoresChange((current) => {
      if (current.includes(name)) {
        return current.filter((item) => item !== name);
      }
      return [...current, name];
    });
  }

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

  return (
    <div className="store-filter space-y-5">
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
          <h3 className="store-filter-title">
            テリトリー（不要なものはタップして外す）
          </h3>
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
            <h3 className="store-filter-title">所属店舗を選択（複数選択可）</h3>
            <span className="store-filter-count">
              {visibleSelectedCount}/{visibleStores.length}
            </span>
          </div>
          <p className="store-filter-hint">
            複数の店舗に所属している場合は、該当する店舗をすべてタップしてください。もう一度タップで解除できます。
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
                    {
                      areaStores.filter((store) => selectedSet.has(store.storeName))
                        .length
                    }
                    /{areaStores.length}
                  </span>
                </button>
                {openAreas.has(area) && (
                  <div className="store-filter-chips store-filter-chips--stores">
                    {areaStores.map((store) => {
                      const isSelected = selectedSet.has(store.storeName);
                      return (
                        <button
                          key={storeKey(store)}
                          type="button"
                          disabled={disabled}
                          className={`store-filter-chip ${isSelected ? "store-filter-chip--on" : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleStore(store);
                          }}
                        >
                          {store.storeName}
                          {registeredStores.includes(store.storeName)
                            ? "（登録済）"
                            : ""}
                        </button>
                      );
                    })}
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
