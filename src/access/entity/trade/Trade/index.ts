import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { GFarmTradingStorageV5__openTradesResult } from "types/GNSTradingV6/GFarmTradingStorageV5";
import { Trade } from "types/schema";

export type TradeTuple = {
  trader: Address;
  pairIndex: BigInt;
  index: BigInt;
};

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
    tx.hash.toHex() +
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
  return `${trader.toHex()}-${pairIndex.toString()}-${index.toString()}`;
}

export function generateIdFromTradeTuple(tradeTuple: TradeTuple): string {
  return `${tradeTuple.trader.toHex()}-${tradeTuple.pairIndex.toString()}-${tradeTuple.index.toString()}`;
}

export function updateTradeFromContractObject(
  trade: Trade,
  cTrade: GFarmTradingStorageV5__openTradesResult,
  save: boolean
): Trade {
  const [
    trader,
    pairIndex,
    index,
    initialPosToken,
    positionSizeDai,
    openPrice,
    buy,
    leverage,
    tp,
    sl,
  ] = [
    cTrade.value0,
    cTrade.value1,
    cTrade.value2,
    cTrade.value3,
    cTrade.value4,
    cTrade.value5,
    cTrade.value6,
    cTrade.value7,
    cTrade.value8,
    cTrade.value9,
  ];

  trade.trader = trader.toHexString();
  trade.pairIndex = pairIndex;
  trade.index = index;
  trade.initialPosToken = initialPosToken;
  trade.positionSizeDai = positionSizeDai;
  trade.openPrice = openPrice;
  trade.buy = buy;
  trade.leverage = leverage;
  trade.tp = tp;
  trade.sl = sl;

  if (save) {
    trade.save();
  }
  return trade;
}
