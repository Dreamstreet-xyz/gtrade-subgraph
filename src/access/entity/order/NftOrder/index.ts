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
  event: ethereum.Event
): NftOrder {
  let nftOrder = NftOrder.load(id);
  if (!nftOrder) {
    nftOrder = new NftOrder(id);
    nftOrder.createdAtTimestamp = event.block.timestamp;
    nftOrder.createdAtBlockNumber = event.block.number;
    nftOrder.transactions = [event.transaction.hash.toHexString()];
    nftOrder.blocks = [event.block.number];
    nftOrder.tokenId = -1;
    nftOrder.status = PRICE_ORDER_STATUS.NONE;
    nftOrder.price = BigInt.fromI32(0);
    nftOrder.nftHolder = ZERO_ADDRESS;
    nftOrder.nftId = -1;
    nftOrder.price = BigInt.fromI32(0);
    nftOrder.save();
    log.info("[createOrLoadNftOrder] Created new NftOrder {}", [id]);
  } else {
    const txs = nftOrder.transactions;
    txs.push(event.transaction.hash.toHexString());
    nftOrder.transactions = txs;

    const blocks = nftOrder.blocks;
    blocks.push(event.block.number);
    nftOrder.blocks = blocks;
  }

  return nftOrder;
}

export function updateNftOrderFromContractObject(
  nftOrder: NftOrder,
  cNftOrder: GFarmTradingStorageV5__reqID_pendingNftOrderResult,
  save: boolean
): NftOrder | null {
  const nftHolder = cNftOrder.value0;
  const nftId = cNftOrder.value1.toI32();
  const trader = cNftOrder.value2;
  const pairIndex = cNftOrder.value3.toI32();
  const index = cNftOrder.value4.toI32();
  const orderType = cNftOrder.value5;

  if (trader.toHexString() == ZERO_ADDRESS) {
    log.error("[updateNftOrderFromContractObject] No cNftOrder", []);
    return null;
  }

  nftOrder.nftHolder = nftHolder.toHexString();
  nftOrder.nftId = nftId;
  nftOrder.nftOrderType = LIMIT_ORDER_TYPE_IX[orderType];

  if (save) {
    nftOrder.save();
  }

  return nftOrder as NftOrder;
}
