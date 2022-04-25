import { ContractTradeState } from "../../../../types/schema";
import { generateIdFromTradeTuple, TradeTuple } from "../Trade";

export function getOpenTradeInfoId(
  state: ContractTradeState,
  tradeTuple: TradeTuple
): string {
  return JSON.parse(state._openTradesInfoLookup || "{}")[
    generateIdFromTradeTuple(tradeTuple)
  ];
}

export function addOpenTradeInfo(
  state: ContractTradeState,
  tradeTuple: TradeTuple,
  tradeInfoId: string,
  save: boolean
): ContractTradeState {
  const openTradesInfo = JSON.parse(state._openTradesInfoLookup || "{}");
  openTradesInfo[generateIdFromTradeTuple(tradeTuple)] = tradeInfoId;
  state._openTradesInfoLookup = JSON.stringify(openTradesInfo);
  if (save) {
    state.save();
  }
  return state;
}

export function removeOpenTradeInfo(
  state: ContractTradeState,
  tradeTuple: TradeTuple,
  save: boolean
): ContractTradeState {
  const openTradesInfo = JSON.parse(state._openTradesInfoLookup || "{}");
  delete openTradesInfo[generateIdFromTradeTuple(tradeTuple)];
  if (save) {
    state.save();
  }
  return state;
}
