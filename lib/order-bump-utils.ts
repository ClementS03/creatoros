import type { OrderBumps } from "@/types/index";

export function calculateBumpTotal(orderBumps: OrderBumps, selectedIds: string[]): number {
  if (selectedIds.length === 0) return 0;
  if (
    selectedIds.length === orderBumps.items.length &&
    orderBumps.bundle_price !== null
  ) {
    return orderBumps.bundle_price;
  }
  return orderBumps.items
    .filter(item => selectedIds.includes(item.product_id))
    .reduce((sum, item) => sum + item.custom_price, 0);
}
