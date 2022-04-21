import { LIMIT_ORDER_IX } from "constants/index";
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

  nftOrder.nftHolder = nftHolder.toHexString();
  nftOrder.nftId = nftId;
  nftOrder.type = LIMIT_ORDER_IX[orderType];

  if (save) {
    nftOrder.save();
  }

  return nftOrder;
}
