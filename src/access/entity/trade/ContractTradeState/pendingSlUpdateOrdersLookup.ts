import { ContractTradeState, SlUpdateOrder } from "../../../../types/schema";

export function getPendingSlUpdateOrderId(
  state: ContractTradeState,
  orderId: string
): string {
  return JSON.parse(state._pendingSlUpdateOrdersLookup || "{}")[orderId];
}

export function addPendingSlUpdateOrder(
  state: ContractTradeState,
  orderId: string,
  slUpdateOrderId: string,
  save: boolean
): ContractTradeState {
  const pendingSlUpdateOrdersLookup = JSON.parse(
    state._pendingSlUpdateOrdersLookup || "{}"
  );
  pendingSlUpdateOrdersLookup[orderId] = slUpdateOrderId;
  state._pendingSlUpdateOrdersLookup = JSON.stringify(
    pendingSlUpdateOrdersLookup
  );
  if (save) {
    state.save();
  }
  return state;
}

export function removePendingSlUpdateOrder(
  state: ContractTradeState,
  orderId: string,
  save: boolean
): ContractTradeState {
  const pendingSlUpdateOrdersLookup = JSON.parse(
    state._pendingSlUpdateOrdersLookup || "{}"
  );
  delete pendingSlUpdateOrdersLookup[orderId];
  state._pendingSlUpdateOrdersLookup = JSON.stringify(
    pendingSlUpdateOrdersLookup
  );
  if (save) {
    state.save();
  }
  return state;
}
