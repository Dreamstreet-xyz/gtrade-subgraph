import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { PRICE_ORDER_STATUS } from "../../../../helpers/constants";
import { SlUpdateOrder } from "../../../../types/schema";

export function createOrLoadSlUpdateOrder(
  id: string,
  block: ethereum.Block
): SlUpdateOrder {
  let slUpdateOrder = SlUpdateOrder.load(id);
  if (!slUpdateOrder) {
    slUpdateOrder = new SlUpdateOrder(id);
    slUpdateOrder.createdAtTimestamp = block.timestamp;
    slUpdateOrder.createdAtBlockNumber = block.number;
    slUpdateOrder.tokenId = -1;
    slUpdateOrder.status = PRICE_ORDER_STATUS.NONE;
    slUpdateOrder.price = BigInt.fromI32(0);
    slUpdateOrder.newSl = BigInt.fromI32(0);
    slUpdateOrder.save();
    log.info("[createOrLoadSlUpdateOrder] Created new SlUpdateOrder {}", [id]);
  }

  return slUpdateOrder;
}
