import { log } from "@graphprotocol/graph-ts";
import {
  getPendingSlUpdateOrderId,
  getTradesState,
  removePendingSlUpdateOrder,
} from "access/entity";
import { PRICE_ORDER_STATUS } from "constants/index";
import { SlCanceled } from "types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { SlUpdateOrder } from "types/schema";

/**
 * Event is emitted when a trade's stop loss update request is canceled.
 *
 * Basic flow:
 * a. update SlUpdateOrder
 * b. update state
 *
 * @param event SlCanceled
 * @returns
 */
export function handleSlCanceled(event: SlCanceled): void {
  const { orderId, trader, pairIndex, index } = event.params;

  let state = getTradesState();

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

  // save
  slUpdateOrder.save();
  state.save();
}
