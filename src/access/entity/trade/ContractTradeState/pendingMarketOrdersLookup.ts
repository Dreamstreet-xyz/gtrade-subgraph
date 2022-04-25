import { ContractTradeState, MarketOrder } from "../../../../types/schema";

export function getPendingMarketOrderId(
  state: ContractTradeState,
  orderId: string
): string {
  return JSON.parse(state._pendingMarketOrdersLookup || "{}")[orderId];
}

export function addPendingMarketOrder(
  state: ContractTradeState,
  orderId: string,
  marketOrderId: string,
  save: boolean
): ContractTradeState {
  const pendingMarketOrdersLookup = JSON.parse(
    state._pendingMarketOrdersLookup || "{}"
  );
  pendingMarketOrdersLookup[orderId] = marketOrderId;
  state._pendingMarketOrdersLookup = JSON.stringify(pendingMarketOrdersLookup);
  if (save) {
    state.save();
  }
  return state;
}

export function removePendingMarketOrder(
  state: ContractTradeState,
  orderId: string,
  save: boolean
): ContractTradeState {
  const pendingMarketOrdersLookup = JSON.parse(
    state._pendingMarketOrdersLookup || "{}"
  );
  delete pendingMarketOrdersLookup[orderId];
  state._pendingMarketOrdersLookup = JSON.stringify(pendingMarketOrdersLookup);
  if (save) {
    state.save();
  }
  return state;
}
