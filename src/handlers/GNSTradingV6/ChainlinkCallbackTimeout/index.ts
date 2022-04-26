import { log } from "@graphprotocol/graph-ts";
import {
  getPendingMarketOrderId,
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

  log.info("[handleChainlinkCallbackTimeout] OrderId {}", [orderId.toString()]);

  // read orderId from state
  const marketOrderId = getPendingMarketOrderId(orderId.toString());
  const marketOrder = MarketOrder.load(marketOrderId);
  if (!marketOrder) {
    log.error(
      "[handleChainlinkCallbackTimeout] MarketOrder not found for orderId",
      [orderId.toString()]
    );
    return;
  }
  marketOrder.status = PRICE_ORDER_STATUS.TIMED_OUT;
  log.info("[handleChainlinkCallbackTimeout] Updated MarketOrder {}", [
    marketOrderId,
  ]);

  // determine if the order was on open or close using the attached Trade obj
  const trade = Trade.load(marketOrder.trade);
  if (!trade) {
    log.error("[handleChainlinkCallbackTimeout] Trade not found for orderId", [
      orderId.toString(),
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
  log.info("[handleChainlinkCallbackTimeout] Updated Trade {}", [trade.id]);

  // unregister pending market order
  removePendingMarketOrder(orderId.toString());

  // save
  marketOrder.save();
  trade.save();
}
