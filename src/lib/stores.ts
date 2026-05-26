export const STORES = [
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
] as const;

export type StoreName = (typeof STORES)[number];

export function isValidStore(name: string): name is StoreName {
  return (STORES as readonly string[]).includes(name);
}
