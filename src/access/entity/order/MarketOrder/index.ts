import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { PRICE_ORDER_STATUS } from "../../../../helpers/constants";
import { MarketOrder } from "../../../../types/schema";

export function createOrLoadMarketOrder(
  id: string,
  event: ethereum.Event
): MarketOrder {
  let marketOrder = MarketOrder.load(id);
  if (!marketOrder) {
    marketOrder = new MarketOrder(id);
    marketOrder.createdAtTimestamp = event.block.timestamp;
    marketOrder.createdAtBlockNumber = event.block.number;
    marketOrder.transactions = [event.transaction.hash.toHexString()];
    marketOrder.blocks = [event.block.number];
    marketOrder.tokenId = -1;
    marketOrder.status = PRICE_ORDER_STATUS.NONE;
    marketOrder.wantedPrice = BigInt.fromI32(0);
    marketOrder.slippageP = BigInt.fromI32(0);
    marketOrder.spreadReductionP = BigInt.fromI32(0);
    marketOrder.price = BigInt.fromI32(0);
    marketOrder.save();
    log.info("[createOrLoadMarketOrder] Created new MarketOrder {}", [id]);
  } else {
    const txs = marketOrder.transactions;
    txs.push(event.transaction.hash.toHexString());
    marketOrder.transactions = txs;

    const blocks = marketOrder.blocks;
    blocks.push(event.block.number);
    marketOrder.blocks = blocks;
  }

  return marketOrder;
}
