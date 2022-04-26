import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct,
  GFarmTradingStorageV5__openTradesResult,
} from "../../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { Trade } from "../../../../types/schema";

export class TradeTuple {
  trader: Address;
  pairIndex: BigInt;
  index: BigInt;
}

export function stringifyTuple(tuple: TradeTuple): string {
  return `{trader: ${tuple.trader.toHexString()}, pairIndex: ${tuple.pairIndex.toString()}, index: ${tuple.index.toString()}}`;
}

/**
 * Generate a deterministic id for a given trade event
 * @param tx
 * @param logIndex
 * @param tradeTuple
 * @returns ID as a string
 */
export function generateTradeId(
  tx: ethereum.Transaction,
  logIndex: BigInt,
  tradeTuple: TradeTuple
): string {
  return (
    tx.hash.toHexString() +
    "-" +
    logIndex.toString() +
    generateIdFromTradeTuple(tradeTuple)
  );
}

export function generateIdFromRawTradeTuple(
  trader: Address,
  pairIndex: BigInt,
  index: BigInt
): string {
  return `${trader.toHexString()}-${pairIndex.toString()}-${index.toString()}`;
}

export function generateIdFromTradeTuple(tradeTuple: TradeTuple): string {
  return `${tradeTuple.trader.toHexString()}-${tradeTuple.pairIndex.toString()}-${tradeTuple.index.toString()}`;
}

export function updateTradeFromContractObject(
  trade: Trade,
  cTrade: GFarmTradingStorageV5__openTradesResult,
  save: boolean
): Trade {
  const trader = cTrade.value0;
  const pairIndex = cTrade.value1;
  const index = cTrade.value2;
  const initialPosToken = cTrade.value3;
  const positionSizeDai = cTrade.value4;
  const openPrice = cTrade.value5;
  const buy = cTrade.value6;
  const leverage = cTrade.value7;
  const tp = cTrade.value8;
  const sl = cTrade.value9;

  if (leverage.toI32() === 0) {
    throw Error("[updateTradeFromContractObject] No trade");
  }

  trade.trader = trader.toHexString();
  trade.pairIndex = pairIndex.toI32();
  trade.index = index.toI32();
  trade.initialPosToken = initialPosToken;
  trade.positionSizeDai = positionSizeDai;
  trade.openPrice = openPrice;
  trade.buy = buy;
  trade.leverage = leverage.toI32();
  trade.tp = tp;
  trade.sl = sl;

  if (save) {
    trade.save();
  }
  return trade;
}

export function updateTradeFromOpenLimitOrderContractObject(
  trade: Trade,
  cOpenLimitOrder: GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct,
  save: boolean
): Trade {
  trade.pairIndex = cOpenLimitOrder.pairIndex.toI32();
  trade.index = cOpenLimitOrder.index.toI32();
  trade.positionSizeDai = cOpenLimitOrder.positionSize;
  trade.buy = cOpenLimitOrder.buy;
  trade.leverage = cOpenLimitOrder.leverage.toI32();
  trade.tp = cOpenLimitOrder.tp;
  trade.sl = cOpenLimitOrder.sl;

  if (save) {
    trade.save();
  }

  return trade;
}
