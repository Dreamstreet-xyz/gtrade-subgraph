import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  OPEN_LIMIT_ORDER_STATUS,
  ZERO_ADDRESS,
} from "../../../../helpers/constants";
import { GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct } from "../../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { OpenLimitOrder } from "../../../../types/schema";

export function createOrLoadOpenLimitOrder(
  id: string,
  event: ethereum.Event
): OpenLimitOrder {
  let openLimitOrder = OpenLimitOrder.load(id);
  if (!openLimitOrder) {
    openLimitOrder = new OpenLimitOrder(id);
    openLimitOrder.createdAtTimestamp = event.block.timestamp;
    openLimitOrder.createdAtBlockNumber = event.block.number;
    openLimitOrder.transactions = [event.transaction.hash.toHexString()];
    openLimitOrder.blocks = [event.block.number];
    openLimitOrder.tokenId = -1;
    openLimitOrder.status = OPEN_LIMIT_ORDER_STATUS.NONE;
    openLimitOrder.minPrice = BigInt.fromI32(0);
    openLimitOrder.maxPrice = BigInt.fromI32(0);
    openLimitOrder.block = BigInt.fromI32(0);
    openLimitOrder.spreadReductionP = BigInt.fromI32(0);
    openLimitOrder.save();
    log.info("[createOrLoadOpenLimitOrder] Created new OpenLimitOrder {}", [
      id,
    ]);
  } else {
    const txs = openLimitOrder.transactions;
    txs.push(event.transaction.hash.toHexString());
    openLimitOrder.transactions = txs;

    const blocks = openLimitOrder.blocks;
    blocks.push(event.block.number);
    openLimitOrder.blocks = blocks;
  }

  return openLimitOrder;
}

export function updateOpenLimitOrderFromContractObject(
  openLimitOrder: OpenLimitOrder,
  cOpenLimitOrder: GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct,
  save: boolean
): OpenLimitOrder | null {
  if (cOpenLimitOrder.trader.toHexString() == ZERO_ADDRESS) {
    log.error(
      "[updateOpenLimitOrderFromContractObject] No cOpenLimitOrder",
      []
    );
    return null;
  }

  openLimitOrder.spreadReductionP = cOpenLimitOrder.spreadReductionP;
  openLimitOrder.minPrice = cOpenLimitOrder.minPrice;
  openLimitOrder.maxPrice = cOpenLimitOrder.maxPrice;
  openLimitOrder.block = cOpenLimitOrder.block;
  openLimitOrder.tokenId = cOpenLimitOrder.tokenId.toI32();

  if (save) {
    openLimitOrder.save();
  }
  return openLimitOrder as OpenLimitOrder;
}
