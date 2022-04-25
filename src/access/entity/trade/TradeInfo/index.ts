import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { GFarmTradingStorageV5__openTradesInfoResult } from "../../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { TradeInfo } from "../../../../types/schema";
import { TradeTuple, generateIdFromTradeTuple } from "../Trade";
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

  if (Number(tokenPriceDai) === 0) {
    throw Error("[updateTradeInfoFromContractObject] No TradeInfo");
  }

  tradeInfo.tokenId = tokenId;
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
