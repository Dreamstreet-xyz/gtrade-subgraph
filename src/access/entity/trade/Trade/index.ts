import {
  Address,
  ethereum,
  BigInt,
  crypto,
  ByteArray,
  log,
} from "@graphprotocol/graph-ts";
import { TRADE_STATUS, ZERO_ADDRESS } from "../../../../helpers/constants";
import {
  GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct,
  GFarmTradingStorageV5__openTradesResult,
} from "../../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { Trade } from "../../../../types/schema";

export class TradeTuple {
  trader!: Address;
  pairIndex!: BigInt;
  index!: BigInt;
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
  return crypto
    .keccak256(
      ByteArray.fromUTF8(
        tx.hash.toHexString() +
          "-" +
          logIndex.toString() +
          generateIdFromTradeTuple(tradeTuple)
      )
    )
    .toHexString();
}

export function generateIdFromRawTradeTuple(
  trader: Address,
  pairIndex: BigInt,
  index: BigInt
): string {
  return crypto
    .keccak256(
      ByteArray.fromUTF8(
        `${trader.toHexString()}-${pairIndex.toString()}-${index.toString()}`
      )
    )
    .toHexString();
}

export function generateIdFromTradeTuple(tradeTuple: TradeTuple): string {
  return generateIdFromRawTradeTuple(
    tradeTuple.trader,
    tradeTuple.pairIndex,
    tradeTuple.index
  );
}

export function createOrLoadTrade(id: string, block: ethereum.Block): Trade {
  let trade = Trade.load(id);
  if (trade == null) {
    trade = new Trade(id);
    trade.createdAtBlockNumber = block.number;
    trade.createdAtTimestamp = block.timestamp;
    trade.status = TRADE_STATUS.NONE;
    trade.trader = ZERO_ADDRESS;
    trade.pairIndex = -1;
    trade.index = -1;
    trade.initialPosToken = BigInt.fromI32(-1);
    trade.positionSizeDai = BigInt.fromI32(-1);
    trade.openPrice = BigInt.fromI32(-1);
    trade.closePrice = BigInt.fromI32(-1);
    trade.buy = false;
    trade.leverage = 0;
    trade.tp = BigInt.fromI32(-1);
    trade.sl = BigInt.fromI32(-1);
    trade.save();
  }
  return trade as Trade;
}

/**
 * Takes Trade entity and openTrade contract objects and updates the entity.
 *
 * @param trade
 * @param cTrade
 * @param save
 * @returns
 */
export function updateTradeFromContractObject(
  trade: Trade,
  cTrade: GFarmTradingStorageV5__openTradesResult,
  save: boolean
): Trade | null {
  const trader = cTrade.value0;
  const pairIndex = cTrade.value1;
  const index = cTrade.value2;
  const initialPosToken = cTrade.value3;
  // const positionSizeDai = cTrade.value4;
  const openPrice = cTrade.value5;
  const buy = cTrade.value6;
  const leverage = cTrade.value7;
  const tp = cTrade.value8;
  const sl = cTrade.value9;

  if (trader.toHexString() == ZERO_ADDRESS) {
    log.error("[updateTradeFromContractObject] No trade", []);
    return null;
  }

  trade.trader = trader.toHexString();
  trade.pairIndex = pairIndex.toI32();
  trade.index = index.toI32();
  trade.initialPosToken = initialPosToken;
  // trade.positionSizeDai = positionSizeDai;
  trade.openPrice = openPrice;
  trade.buy = buy;
  trade.leverage = leverage.toI32();
  trade.tp = tp;
  trade.sl = sl;

  if (save) {
    trade.save();
  }
  return trade as Trade;
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

export { transitionTradeToOpen, transitionTradeToClose } from "./transition";
