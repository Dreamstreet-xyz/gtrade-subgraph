import { log } from "@graphprotocol/graph-ts";
import {
  createOrLoadSlUpdateOrder,
  getPendingSlUpdateOrderId,
  removePendingSlUpdateOrder,
} from "../../../access/entity";
import { PRICE_ORDER_STATUS } from "../../../helpers/constants";
import { SlCanceled } from "../../../types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { SlUpdateOrder } from "../../../types/schema";

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
  const orderId = event.params.orderId;

  log.info("[handleSlCanceled] OrderId {}", [orderId.toString()]);

  // update SlUpdateOrder
  const slUpdateOrderId = getPendingSlUpdateOrderId(orderId.toString());
  if (!slUpdateOrderId) {
    log.error(
      "[handleSlUpdated] SlUpdateOrder for OrderId {} not found in state",
      [orderId.toString()]
    );
    return;
  }
  const slUpdateOrder = createOrLoadSlUpdateOrder(slUpdateOrderId, event);
  slUpdateOrder.status = PRICE_ORDER_STATUS.RECEIVED;
  log.info("[handleSlCanceled] Updated SlUpdateOrder {}", [slUpdateOrderId]);

  // update state
  removePendingSlUpdateOrder(orderId.toString());

  // save
  slUpdateOrder.save();
}
