import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { PRICE_ORDER_STATUS } from "../../../../helpers/constants";
import { MarketOrder } from "../../../../types/schema";

export function createOrLoadMarketOrder(
  id: string,
  block: ethereum.Block
): MarketOrder {
  let marketOrder = MarketOrder.load(id);
  if (!marketOrder) {
    marketOrder = new MarketOrder(id);
    marketOrder.createdAtTimestamp = block.timestamp;
    marketOrder.createdAtBlockNumber = block.number;
    marketOrder.tokenId = -1;
    marketOrder.status = PRICE_ORDER_STATUS.NONE;
    marketOrder.wantedPrice = BigInt.fromI32(0);
    marketOrder.slippageP = BigInt.fromI32(0);
    marketOrder.spreadReductionP = BigInt.fromI32(0);
    marketOrder.price = BigInt.fromI32(0);
    marketOrder.save();
    log.info("[createOrLoadMarketOrder] Created new MarketOrder {}", [id]);
  }

  return marketOrder;
}
