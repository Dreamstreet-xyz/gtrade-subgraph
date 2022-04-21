import { ContractTradeState } from "types/schema";
import { generateIdFromTradeTuple, TradeTuple } from "../Trade";

export function getOpenTradeId(
  state: ContractTradeState,
  tradeTuple: TradeTuple
): string {
  return JSON.parse(state._openTradesLookup || "{}")[
    generateIdFromTradeTuple(tradeTuple)
  ];
}

export function addOpenTrade(
  state: ContractTradeState,
  tradeTuple: TradeTuple,
  tradeId: string,
  save: boolean
): ContractTradeState {
  const openTrades = JSON.parse(state._openTradesLookup || "{}");
  openTrades[generateIdFromTradeTuple(tradeTuple)] = tradeId;
  state._openTradesLookup = JSON.stringify(openTrades);
  if (save) {
    state.save();
  }
  return state;
}

export function removeOpenTrade(
  state: ContractTradeState,
  tradeTuple: TradeTuple,
  save: boolean
): ContractTradeState {
  const openTrades = JSON.parse(state._openTradesLookup || "{}");
  delete openTrades[generateIdFromTradeTuple(tradeTuple)];
  if (save) {
    state.save();
  }
  return state;
}
