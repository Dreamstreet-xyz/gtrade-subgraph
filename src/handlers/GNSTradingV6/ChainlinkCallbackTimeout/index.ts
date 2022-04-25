import { log } from "@graphprotocol/graph-ts";
import {
  getPendingMarketOrderId,
  getTradesState,
  removePendingMarketOrder,
} from "../../../access/entity";
import { PRICE_ORDER_STATUS, TRADE_STATUS } from "../../../helpers/constants";
import { ChainlinkCallbackTimeout } from "../../../types/GNSTradingV6/GNSTradingV6";
import { MarketOrder, Trade } from "../../../types/schema";

/**
 * Event is emitted when a market order times out. If on trade open, it is canceled. If on trade close, it is closed.
 *
 * Basic flow:
 * a. update MarketOrder status
 * b. update Trade status
 * c. update contract state
 *
 * @param event ChainlinkCallbackTimeout
 */
export function handleChainlinkCallbackTimeout(
  event: ChainlinkCallbackTimeout
): void {
  const orderId = event.params.orderId;

  // read orderId from state
  let state = getTradesState();
  const marketOrderId = getPendingMarketOrderId(state, orderId.toHexString());
  const marketOrder = MarketOrder.load(marketOrderId);
  if (!marketOrder) {
    log.error(
      "[handleChainlinkCallbackTimeout] MarketOrder not found for orderId",
      [orderId.toHexString()]
    );
    return;
  }
  marketOrder.status = PRICE_ORDER_STATUS.TIMED_OUT;

  // determine if the order was on open or close using the attached Trade obj
  const trade = Trade.load(marketOrder.trade);
  if (!trade) {
    log.error("[handleChainlinkCallbackTimeout] Trade not found for orderId", [
      orderId.toHexString(),
    ]);
    return;
  }

  // on open -> OPEN_TIMED_OUT
  if (trade.status !== TRADE_STATUS.CLOSING) {
    trade.status = TRADE_STATUS.OPEN_TIMED_OUT;
  } else {
    // on close -> CLOSE_TIMED_OUT
    trade.status = TRADE_STATUS.CLOSE_TIMED_OUT;
  }
  // unregister pending market order
  state = removePendingMarketOrder(state, orderId.toHexString(), false);

  // save
  marketOrder.save();
  trade.save();
  state.save();
}
