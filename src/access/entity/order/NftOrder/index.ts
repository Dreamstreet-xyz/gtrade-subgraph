import { LIMIT_ORDER_TYPE_IX, ZERO_ADDRESS } from "constants/index";
import { GFarmTradingStorageV5__reqID_pendingNftOrderResult } from "types/GNSTradingV6/GFarmTradingStorageV5";
import { NftOrder } from "types/schema";

export function updateNftOrderFromContractObject(
  nftOrder: NftOrder,
  cNftOrder: GFarmTradingStorageV5__reqID_pendingNftOrderResult,
  save: boolean
): NftOrder {
  const [nftHolder, nftId, trader, pairIndex, index, orderType] = [
    cNftOrder.value0,
    cNftOrder.value1,
    cNftOrder.value2,
    cNftOrder.value3,
    cNftOrder.value4,
    cNftOrder.value5,
  ];

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
