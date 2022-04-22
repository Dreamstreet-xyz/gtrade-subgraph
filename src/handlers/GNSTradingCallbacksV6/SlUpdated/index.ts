import { log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "access/contract";
import {
  getPendingSlUpdateOrderId,
  getTradesState,
  removePendingSlUpdateOrder,
  updateTradeAndTradeInfoToLatestFromTuple,
} from "access/entity";
import { PRICE_ORDER_STATUS } from "constants/index";
import { SlUpdated } from "types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { SlUpdateOrder } from "types/schema";

/**
 * Event is emitted when a trade's stop loss update request is fulfilled and the stop loss is updated.
 *
 * This event is not to be confused with GNSTradingV6.SlUpdated
 *
 * Basic flow:
 * a. update SlUpdateOrder
 * b. update Trade and TradeInfo
 * c. update state
 *
 * @param event SlUpdated
 */
export function handleSlUpdated(event: SlUpdated): void {
  const { orderId, trader, pairIndex, index, newSl } = event.params;

  const tuple = { trader, pairIndex, index };

  let state = getTradesState();
  const storage = getStorageContract();

  // update SlUpdateOrder
  const slUpdateOrderId = getPendingSlUpdateOrderId(
    state,
    orderId.toHexString()
  );
  const slUpdateOrder = SlUpdateOrder.load(slUpdateOrderId);
  if (!slUpdateOrder) {
    log.error("[handleSlUpdated] SlUpdateOrder {} not found for orderId {}", [
      slUpdateOrderId,
      orderId.toHexString(),
    ]);
    return;
  }
  slUpdateOrder.status = PRICE_ORDER_STATUS.RECEIVED;

  // update state
  state = removePendingSlUpdateOrder(state, orderId.toHexString(), false);

  try {
    updateTradeAndTradeInfoToLatestFromTuple(state, storage, tuple, true);
  } catch (e) {
    log.error(
      "[GNSTradingCallbacksV6.handleSlUpdated] Error updating trade and tradeInfo for tuple {}",
      [JSON.stringify(tuple)]
    );
  }

  // save
  slUpdateOrder.save();
  state.save();
}
