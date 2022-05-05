import { log } from "@graphprotocol/graph-ts";
import { GFarmTradingStorageV5 } from "../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { Trade, TradeInfo } from "../../../types/schema";
import { getOpenTradeId, getOpenTradeInfoId } from "./ContractIdMapping";
import {
  TradeTuple,
  updateTradeFromContractObject,
  stringifyTuple,
} from "./Trade";
import { updateTradeInfoFromContractObject } from "./TradeInfo";

export class TradeAndTradeInfo {
  trade!: Trade;
  tradeInfo!: TradeInfo;
}

export function updateTradeAndTradeInfoToLatestFromTuple(
  storage: GFarmTradingStorageV5,
  tuple: TradeTuple,
  save: boolean
): TradeAndTradeInfo {
  // update Trade obj from contract
  const tradeId = getOpenTradeId(tuple);
  let trade = Trade.load(tradeId);
  if (!trade) {
    log.error(
      "[updateTradeAndTradeInfoToLatestFromTuple] Trade {} not found for tuple {}",
      [tradeId, stringifyTuple(tuple)]
    );
    throw new Error(
      "[updateTradeAndTradeInfoToLatestFromTuple] Trade not found"
    );
  }
  const cTradeResp = storage.try_openTrades(
    tuple.trader,
    tuple.pairIndex,
    tuple.index
  );
  if (!cTradeResp.reverted) {
    const cTrade = cTradeResp.value;
    trade = updateTradeFromContractObject(trade, cTrade, false);
  } else {
    log.error(
      "[updateTradeAndTradeInfoToLatestFromTuple] try_openTrades reverted call to chain, possible reorg. Tuple {}",
      [stringifyTuple(tuple)]
    );
  }

  // update TradeInfo obj from contract
  const tradeInfoId = getOpenTradeInfoId(tuple);
  let tradeInfo = TradeInfo.load(tradeInfoId);
  if (!tradeInfo) {
    log.error(
      "[updateTradeAndTradeInfoToLatestFromTuple] TradeInfo {} not found for tuple {}",
      [tradeInfoId, stringifyTuple(tuple)]
    );
    throw new Error(
      "[updateTradeAndTradeInfoToLatestFromTuple] TradeInfo not found"
    );
  }
  const cTradeInfoResp = storage.try_openTradesInfo(
    tuple.trader,
    tuple.pairIndex,
    tuple.index
  );
  if (!cTradeInfoResp.reverted) {
    const cTradeInfo = cTradeInfoResp.value;
    tradeInfo = updateTradeInfoFromContractObject(tradeInfo, cTradeInfo, false);
  } else {
    log.error(
      "[updateTradeAndTradeInfoToLatestFromTuple] try_openTradesInfo reverted call to chain, possible reorg. Tuple {}",
      [stringifyTuple(tuple)]
    );
  }

  if (save) {
    // save
    trade.save();
    tradeInfo.save();
  }
  return { trade, tradeInfo };
}
