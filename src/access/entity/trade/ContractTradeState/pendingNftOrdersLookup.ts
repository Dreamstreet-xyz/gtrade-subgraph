import { ContractTradeState, NftOrder } from "types/schema";

export function getPendingNftOrderId(
  state: ContractTradeState,
  orderId: string
): string {
  return JSON.parse(state._pendingNftOrdersLookup || "{}")[orderId];
}

export function addPendingNftOrder(
  state: ContractTradeState,
  orderId: string,
  nftOrderId: string,
  save: boolean
): ContractTradeState {
  const pendingNftOrdersLookup = JSON.parse(
    state._pendingNftOrdersLookup || "{}"
  );
  pendingNftOrdersLookup[orderId] = nftOrderId;
  state._pendingNftOrdersLookup = JSON.stringify(pendingNftOrdersLookup);
  if (save) {
    state.save();
  }
  return state;
}

export function removePendingNftOrder(
  state: ContractTradeState,
  orderId: string,
  save: boolean
): ContractTradeState {
  const pendingNftOrdersLookup = JSON.parse(
    state._pendingNftOrdersLookup || "{}"
  );
  delete pendingNftOrdersLookup[orderId];
  state._pendingNftOrdersLookup = JSON.stringify(pendingNftOrdersLookup);
  if (save) {
    state.save();
  }
  return state;
}
