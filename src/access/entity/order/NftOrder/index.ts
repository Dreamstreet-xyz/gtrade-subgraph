import {
  LIMIT_ORDER_TYPE_IX,
  ZERO_ADDRESS,
} from "../../../../helpers/constants";
import { GFarmTradingStorageV5__reqID_pendingNftOrderResult } from "../../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { NftOrder } from "../../../../types/schema";

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

  if (trader.toHexString() === ZERO_ADDRESS) {
    throw Error("[updateNftOrderFromContractObject] No cNftOrder");
  }

  nftOrder.nftHolder = nftHolder.toHexString();
  nftOrder.nftId = nftId;
  nftOrder.nftOrderType = LIMIT_ORDER_TYPE_IX[orderType];

  if (save) {
    nftOrder.save();
  }

  return nftOrder;
}
