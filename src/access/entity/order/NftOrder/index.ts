import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  LIMIT_ORDER_TYPE_IX,
  ZERO_ADDRESS,
  PRICE_ORDER_STATUS,
} from "../../../../helpers/constants";
import { GFarmTradingStorageV5__reqID_pendingNftOrderResult } from "../../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { NftOrder } from "../../../../types/schema";

export function createOrLoadNftOrder(
  id: string,
  block: ethereum.Block
): NftOrder {
  let nftOrder = NftOrder.load(id);
  if (!nftOrder) {
    nftOrder = new NftOrder(id);
    nftOrder.createdAtTimestamp = block.timestamp;
    nftOrder.createdAtBlockNumber = block.number;
    nftOrder.tokenId = -1;
    nftOrder.status = PRICE_ORDER_STATUS.NONE;
    nftOrder.price = BigInt.fromI32(0);
    nftOrder.nftHolder = ZERO_ADDRESS;
    nftOrder.nftId = -1;
    nftOrder.price = BigInt.fromI32(0);
    nftOrder.save();
    log.info("[createOrLoadNftOrder] Created new NftOrder {}", [id]);
  }

  return nftOrder;
}

export function updateNftOrderFromContractObject(
  nftOrder: NftOrder,
  cNftOrder: GFarmTradingStorageV5__reqID_pendingNftOrderResult,
  save: boolean
): NftOrder {
  const nftHolder = cNftOrder.value0;
  const nftId = cNftOrder.value1.toI32();
  const trader = cNftOrder.value2;
  const pairIndex = cNftOrder.value3.toI32();
  const index = cNftOrder.value4.toI32();
  const orderType = cNftOrder.value5;

  if (trader.toHexString() == ZERO_ADDRESS) {
    throw new Error("[updateNftOrderFromContractObject] No cNftOrder");
  }

  nftOrder.nftHolder = nftHolder.toHexString();
  nftOrder.nftId = nftId;
  nftOrder.nftOrderType = LIMIT_ORDER_TYPE_IX[orderType];

  if (save) {
    nftOrder.save();
  }

  return nftOrder;
}
