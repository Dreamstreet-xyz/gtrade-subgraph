import { ZERO_ADDRESS } from "constants/index";
import { GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct } from "types/GNSTradingV6/GFarmTradingStorageV5";
import { OpenLimitOrder } from "types/schema";

export function updateOpenLimitOrderFromContractObject(
  openLimitOrder: OpenLimitOrder,
  cOpenLimitOrder: GFarmTradingStorageV5__getOpenLimitOrderResultValue0Struct,
  save: boolean
): OpenLimitOrder {
  if (cOpenLimitOrder.trader.toHexString() === ZERO_ADDRESS) {
    throw Error("[updateOpenLimitOrderFromContractObject] No cOpenLimitOrder");
  }

  openLimitOrder.spreadReductionP = cOpenLimitOrder.spreadReductionP;
  openLimitOrder.minPrice = cOpenLimitOrder.minPrice;
  openLimitOrder.maxPrice = cOpenLimitOrder.maxPrice;
  openLimitOrder.block = cOpenLimitOrder.block;
  openLimitOrder.tokenId = cOpenLimitOrder.tokenId;

  if (save) {
    openLimitOrder.save();
  }
  return openLimitOrder;
}
