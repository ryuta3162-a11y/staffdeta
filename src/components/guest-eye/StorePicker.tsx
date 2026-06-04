"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  filterStores,
  findStoresByNames,
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
  /** 既に登録されている店舗名。エリア展開と青選択の初期値に使う */
  initialStoreNames?: string[];
  onStoresChange: Dispatch<SetStateAction<string[]>>;
  disabled?: boolean;
}

function expandFiltersForStores(
  stores: StoreRecord[],
  storeNames: string[],
): { areas: Set<string>; territories: Set<string>; openAreas: Set<string> } {
  const matches = findStoresByNames(stores, storeNames);
  const areas = new Set<string>();
  const territories = new Set<string>();
  for (const store of matches) {
    areas.add(store.area);
    territories.add(territoryKey(store.area, store.territory));
  }
  return { areas, territories, openAreas: new Set(areas) };
}

export function StorePicker({
  stores,
  selectedStores,
  initialStoreNames = [],
  onStoresChange,
  disabled,
}: StorePickerProps) {
  const areas = useMemo(() => getAreas(stores), [stores]);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [selectedTerritories, setSelectedTerritories] = useState<Set<string>>(
    new Set(),
  );
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set());
  const didBootstrapFilters = useRef(false);

  const visibleStores = useMemo(
    () => filterStores(stores, selectedAreas, selectedTerritories),
    [stores, selectedAreas, selectedTerritories],
  );

  const groupedStores = useMemo(
    () => groupStoresByArea(visibleStores),
    [visibleStores],
  );

  const selectedSet = useMemo(() => new Set(selectedStores), [selectedStores]);

  const visibleSelectedCount = useMemo(
    () =>
      visibleStores.filter((store) => selectedSet.has(store.storeName)).length,
    [visibleStores, selectedSet],
  );

  useEffect(() => {
    if (didBootstrapFilters.current || stores.length === 0) {
      return;
    }

    const seed =
      initialStoreNames.length > 0 ? initialStoreNames : selectedStores;
    if (seed.length === 0) {
      return;
    }

    const { areas: nextAreas, territories, openAreas: nextOpen } =
      expandFiltersForStores(stores, seed);
    if (nextAreas.size === 0) {
      return;
    }

    setSelectedAreas(nextAreas);
    setSelectedTerritories(territories);
    setOpenAreas(nextOpen);
    didBootstrapFilters.current = true;
  }, [stores, initialStoreNames, selectedStores]);

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

  function toggleStoreByName(name: string) {
    if (disabled) {
      return;
    }

    onStoresChange((current) => {
      if (current.includes(name)) {
        return current.filter((item) => item !== name);
      }
      return [...current, name];
    });
  }

  function toggleStore(store: StoreRecord) {
    toggleStoreByName(store.storeName);
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

  const selectionLabel =
    selectedStores.length === 0
      ? "まだ選択されていません"
      : selectedStores.length === 1
        ? "1店舗で登録します"
        : `${selectedStores.length}店舗で登録します`;

  return (
    <div className="store-filter space-y-5">
      <section className="store-filter-selection-box">
        <div className="store-filter-store-head">
          <h3 className="store-filter-title">登録する店舗</h3>
          <span className="store-filter-count">{selectionLabel}</span>
        </div>
        <p className="store-filter-hint">
          青いボタンが登録対象です。もう一度タップすると解除できます。店舗を減らしたい場合も、青を外してから保存してください。
        </p>
        {selectedStores.length > 0 ? (
          <div className="store-filter-chips mt-3">
            {selectedStores.map((name) => (
              <button
                key={name}
                type="button"
                disabled={disabled}
                className="store-filter-chip store-filter-chip--on"
                onClick={() => toggleStoreByName(name)}
              >
                {name}
              </button>
            ))}
          </div>
        ) : (
          <p className="alert-info mt-3">下のエリアから店舗を選んでください。</p>
        )}
      </section>

      <section>
        <h3 className="store-filter-title">エリア（複数選択可）</h3>
        <p className="store-filter-hint">
          店舗を探すエリアを選びます。登録内容そのものではありません。
        </p>
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
            <h3 className="store-filter-title">店舗一覧（タップで選択・解除）</h3>
            <span className="store-filter-count">
              表示中 {visibleSelectedCount}/{visibleStores.length}
            </span>
          </div>
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
