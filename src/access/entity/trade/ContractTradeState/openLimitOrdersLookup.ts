import { ContractTradeState, OpenLimitOrder } from "types/schema";
import { generateIdFromTradeTuple, TradeTuple } from "../Trade";

export function getOpenLimitOrderId(
  state: ContractTradeState,
  tradeTuple: TradeTuple
): string {
  return JSON.parse(state._openLimitOrdersLookup || "{}")[
    generateIdFromTradeTuple(tradeTuple)
  ];
}

export function addOpenLimitOrder(
  state: ContractTradeState,
  tradeTuple: TradeTuple,
  openLimitOrderId: string,
  save: boolean
): ContractTradeState {
  const openLimitOrdersLookup = JSON.parse(
    state._openLimitOrdersLookup || "{}"
  );
  openLimitOrdersLookup[
    generateIdFromTradeTuple(tradeTuple)
  ] = openLimitOrderId;
  state._openLimitOrdersLookup = JSON.stringify(openLimitOrdersLookup);
  if (save) {
    state.save();
  }
  return state;
}

export function removeOpenLimitOrder(
  state: ContractTradeState,
  tradeTuple: TradeTuple,
  save: boolean
): ContractTradeState {
  const openLimitOrdersLookup = JSON.parse(
    state._openLimitOrdersLookup || "{}"
  );
  delete openLimitOrdersLookup[generateIdFromTradeTuple(tradeTuple)];
  state._openLimitOrdersLookup = JSON.stringify(openLimitOrdersLookup);
  if (save) {
    state.save();
  }
  return state;
}
