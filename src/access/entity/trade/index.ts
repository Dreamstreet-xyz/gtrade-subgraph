import { log } from "@graphprotocol/graph-ts";
import { GFarmTradingStorageV5 } from "types/GNSTradingV6/GFarmTradingStorageV5";
import { ContractTradeState, Trade, TradeInfo } from "types/schema";
import { getOpenTradeId, getOpenTradeInfoId } from "./ContractTradeState";
import { TradeTuple, updateTradeFromContractObject } from "./Trade";
import { updateTradeInfoFromContractObject } from "./TradeInfo";

export function updateTradeAndTradeInfoToLatestFromTuple(
  state: ContractTradeState,
  storage: GFarmTradingStorageV5,
  tuple: TradeTuple,
  save: boolean
): [Trade, TradeInfo] {
  // update Trade obj from contract
  const tradeId = getOpenTradeId(state, tuple);
  let trade = Trade.load(tradeId);
  if (!trade) {
    log.error(
      "[updateTradeAndTradeInfoToLatestFromTuple] Trade {} not found for tuple {}",
      [tradeId, JSON.stringify(tuple)]
    );
    throw Error("[updateTradeAndTradeInfoToLatestFromTuple] Trade not found");
  }
  const cTrade = storage.openTrades(tuple.trader, tuple.pairIndex, tuple.index);
  trade = updateTradeFromContractObject(trade, cTrade, false);

  // update TradeInfo obj from contract
  const tradeInfoId = getOpenTradeInfoId(state, tuple);
  let tradeInfo = TradeInfo.load(tradeInfoId);
  if (!tradeInfo) {
    log.error(
      "[updateTradeAndTradeInfoToLatestFromTuple] TradeInfo {} not found for tuple {}",
      [tradeInfoId, JSON.stringify(tuple)]
    );
    throw Error(
      "[updateTradeAndTradeInfoToLatestFromTuple] TradeInfo not found"
    );
  }
  const cTradeInfo = storage.openTradesInfo(
    tuple.trader,
    tuple.pairIndex,
    tuple.index
  );
  tradeInfo = updateTradeInfoFromContractObject(tradeInfo, cTradeInfo, false);

  if (save) {
    // save
    trade.save();
    tradeInfo.save();
  }
  return [trade, tradeInfo];
}
