import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  OPEN_LIMIT_ORDER_STATUS,
  PRICE_ORDER_STATUS,
  ZERO_ADDRESS,
} from "../../../../helpers/constants";
import { GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct } from "../../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { OpenLimitOrder } from "../../../../types/schema";

export function createOrLoadOpenLimitOrder(
  id: string,
  block: ethereum.Block
): OpenLimitOrder {
  let openLimitOrder = OpenLimitOrder.load(id);
  if (!openLimitOrder) {
    openLimitOrder = new OpenLimitOrder(id);
    openLimitOrder.createdAtTimestamp = block.timestamp;
    openLimitOrder.createdAtBlockNumber = block.number;
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
  }

  return openLimitOrder;
}

export function updateOpenLimitOrderFromContractObject(
  openLimitOrder: OpenLimitOrder,
  cOpenLimitOrder: GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct,
  save: boolean
): OpenLimitOrder {
  if (cOpenLimitOrder.trader.toHexString() == ZERO_ADDRESS) {
    throw new Error(
      "[updateOpenLimitOrderFromContractObject] No cOpenLimitOrder"
    );
  }

  openLimitOrder.spreadReductionP = cOpenLimitOrder.spreadReductionP;
  openLimitOrder.minPrice = cOpenLimitOrder.minPrice;
  openLimitOrder.maxPrice = cOpenLimitOrder.maxPrice;
  openLimitOrder.block = cOpenLimitOrder.block;
  openLimitOrder.tokenId = cOpenLimitOrder.tokenId.toI32();

  if (save) {
    openLimitOrder.save();
  }
  return openLimitOrder;
}
