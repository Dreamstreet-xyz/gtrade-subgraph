import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { PRICE_ORDER_STATUS } from "../../../../helpers/constants";
import { SlUpdateOrder } from "../../../../types/schema";

export function createOrLoadSlUpdateOrder(
  id: string,
  event: ethereum.Event
): SlUpdateOrder {
  let slUpdateOrder = SlUpdateOrder.load(id);
  if (!slUpdateOrder) {
    slUpdateOrder = new SlUpdateOrder(id);
    slUpdateOrder.createdAtTimestamp = event.block.timestamp;
    slUpdateOrder.createdAtBlockNumber = event.block.number;
    slUpdateOrder.transactions = [event.transaction.hash.toHexString()];
    slUpdateOrder.blocks = [event.block.number];
    slUpdateOrder.tokenId = -1;
    slUpdateOrder.status = PRICE_ORDER_STATUS.NONE;
    slUpdateOrder.price = BigInt.fromI32(0);
    slUpdateOrder.newSl = BigInt.fromI32(0);
    slUpdateOrder.save();
    log.info("[createOrLoadSlUpdateOrder] Created new SlUpdateOrder {}", [id]);
  } else {
    const txs = slUpdateOrder.transactions;
    txs.push(event.transaction.hash.toHexString());
    slUpdateOrder.transactions = txs;

    const blocks = slUpdateOrder.blocks;
    blocks.push(event.block.number);
    slUpdateOrder.blocks = blocks;
  }

  return slUpdateOrder;
}
