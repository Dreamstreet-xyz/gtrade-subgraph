import { Address, ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { GFarmTradingStorageV5__openTradesInfoResult } from "../../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { TradeInfo } from "../../../../types/schema";
import { TradeTuple, generateIdFromTradeTuple } from "../Trade";

export function createOrLoadTradeInfo(
  id: string,
  block: ethereum.Block
): TradeInfo {
  let tradeInfo = TradeInfo.load(id);
  if (!tradeInfo) {
    tradeInfo = new TradeInfo(id);
    tradeInfo.createdAtTimestamp = block.timestamp;
    tradeInfo.createdAtBlockNumber = block.number;
    tradeInfo.tokenId = -1;
    tradeInfo.tokenPriceDai = BigInt.fromI32(0);
    tradeInfo.openInterestDai = BigInt.fromI32(0);
    tradeInfo.tpLastUpdated = BigInt.fromI32(0);
    tradeInfo.slLastUpdated = BigInt.fromI32(0);
    tradeInfo.beingMarketClosed = false;
    tradeInfo.save();
    log.info("[createOrLoadTradeInfo] Created new TradeInfo {}", [id]);
  }

  return tradeInfo;
}

/**
 * Generate a deterministic id for a given trade event
 * @param tx
 * @param logIndex
 * @param tradeTuple
 * @returns ID as a string
 */
export function generateTradeInfoId(
  tx: ethereum.Transaction,
  logIndex: BigInt,
  tradeTuple: TradeTuple
): string {
  log.debug(
    "[generateTradeInfoId] Generating trade info id for trade tuple ({}, {}, {})",
    [
      tradeTuple.trader.toHexString(),
      tradeTuple.pairIndex.toString(),
      tradeTuple.index.toString(),
    ]
  );
  return (
    tx.hash.toHexString() +
    "-" +
    logIndex.toString() +
    generateIdFromTradeTuple(tradeTuple)
  );
}

export function updateTradeInfoFromContractObject(
  tradeInfo: TradeInfo,
  cTradeInfo: GFarmTradingStorageV5__openTradesInfoResult,
  save: boolean
): TradeInfo {
  const tokenId = cTradeInfo.value0;
  const tokenPriceDai = cTradeInfo.value1;
  const openInterestDai = cTradeInfo.value2;
  const tpLastUpdated = cTradeInfo.value3;
  const slLastUpdated = cTradeInfo.value4;
  const beingMarketClosed = cTradeInfo.value5;
  log.debug(
    "[updateTradeInfoFromContractObject] cTradeInfo tokenId {}, tokenPriceDai {}, openInterestDai {}, tpLastUpdated {}, slLastUpdated {}, beingMarketClosed {}",
    [
      tokenId.toString(),
      tokenPriceDai.toString(),
      openInterestDai.toString(),
      tpLastUpdated.toString(),
      slLastUpdated.toString(),
      beingMarketClosed.toString(),
    ]
  );

  if (tokenPriceDai.equals(BigInt.fromI32(0))) {
    throw Error("[updateTradeInfoFromContractObject] No TradeInfo");
  }

  tradeInfo.tokenId = tokenId.toI32();
  tradeInfo.tokenPriceDai = tokenPriceDai;
  tradeInfo.openInterestDai = openInterestDai;
  tradeInfo.tpLastUpdated = tpLastUpdated;
  tradeInfo.slLastUpdated = slLastUpdated;
  tradeInfo.beingMarketClosed = beingMarketClosed;

  if (save) {
    tradeInfo.save();
  }
  return tradeInfo;
}
