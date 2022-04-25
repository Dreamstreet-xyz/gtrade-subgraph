import { log } from "@graphprotocol/graph-ts";
import {
  getTradesState,
  removePendingMarketOrder,
} from "../../../access/entity";
import { getPendingMarketOrderId } from "../../../access/entity/trade/ContractTradeState/pendingMarketOrdersLookup";
import { PRICE_ORDER_STATUS, TRADE_STATUS } from "../../../helpers/constants";
import { MarketOpenCanceled } from "../../../types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { MarketOrder, Trade } from "../../../types/schema";

/**
 * Event is emitted when a trade is canceled due to market order details.
 *
 * Basic flow:
 * a. transition MarketOrder to received
 * b. transition Trade to canceled
 * c. update contract state
 *
 * @param event MarketOpenCanceled event
 */
export function handleMarketOpenCanceled(event: MarketOpenCanceled): void {
  const orderId = event.params.orderId;

  let state = getTradesState();

  // update MarketOrder
  const marketOrderId = getPendingMarketOrderId(state, orderId.toString());
  const marketOrder = MarketOrder.load(marketOrderId);
  if (!marketOrder) {
    log.error(
      "[handleMarketOpenCanceled] No market order found for orderId {}",
      [orderId.toString()]
    );
    return;
  }
  marketOrder.status = PRICE_ORDER_STATUS.RECEIVED;

  // update Trade
  let trade = Trade.load(marketOrder.trade);
  if (!trade) {
    log.error(
      "[handleMarketOpenCanceled] No trade found for orderId {}, market order {}",
      [orderId.toString(), marketOrderId]
    );
    return;
  }
  trade.status = TRADE_STATUS.CANCELED;

  // update state
  state = removePendingMarketOrder(state, orderId.toString(), false);

  // save
  marketOrder.save();
  trade.save();
  state.save();
}
