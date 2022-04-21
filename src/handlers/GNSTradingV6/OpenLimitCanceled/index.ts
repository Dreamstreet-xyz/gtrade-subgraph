import { log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "access/contract";
import {
  getOpenLimitOrderId,
  getTradesState,
  removeOpenLimitOrder,
} from "access/entity";
import { OpenLimitCanceled } from "types/GNSTradingV6/GNSTradingV6";
import { OpenLimitOrder, Trade } from "types/schema";
import { OPEN_LIMIT_ORDER_STATUS, TRADE_STATUS } from "constants/index";

/**
 * Event is emitted when an open limit order is canceled before it's been fulfilled.
 *
 * Basic flow:
 * a. update OpenLimitOrder obj
 * b. update Trade obj
 * c. update contract state
 *
 * @param event OpenLimitCanceled
 */
export function handleOpenLimitCanceled(event: OpenLimitCanceled): void {
  const { trader, pairIndex, index } = event.params;

  let state = getTradesState();
  const storage = getStorageContract();

  // read OpenLimitOrder and update status
  const openLimitOrderId = getOpenLimitOrderId(state, {
    trader,
    pairIndex,
    index,
  });
  const openLimitOrder = OpenLimitOrder.load(openLimitOrderId);
  if (!openLimitOrder) {
    log.error(
      "[handleOpenLimitCanceled] OpenLimitOrder not found for tuple {}",
      [JSON.stringify({ trader, pairIndex, index })]
    );
    return;
  }
  openLimitOrder.status = OPEN_LIMIT_ORDER_STATUS.CANCELED;

  // update Trade status
  const trade = Trade.load(openLimitOrder.trade);
  if (!trade) {
    log.error(
      "[handleOpenLimitCanceled] Trade not found for OpenLimitOrder {}",
      [openLimitOrderId]
    );
    return;
  }
  trade.status = TRADE_STATUS.CANCELED;

  // update state
  state = removeOpenLimitOrder(state, { trader, pairIndex, index }, false);

  // save
  openLimitOrder.save();
  trade.save();
  state.save();
}
