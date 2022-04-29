import { log } from "@graphprotocol/graph-ts";
import {
  createOrLoadMarketOrder,
  removePendingMarketOrder,
} from "../../../access/entity";
import { getPendingMarketOrderId } from "../../../access/entity/trade/ContractIdMapping/pendingMarketOrdersLookup";
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
  log.info("[handleMarketOpenCanceled] OrderId {}", [orderId.toString()]);

  // update MarketOrder
  const marketOrderId = getPendingMarketOrderId(orderId.toString());
  if (!marketOrderId) {
    log.error(
      "[handleMarketOpenCanceled] MarketOrder for OrderId {} not found in state",
      [orderId.toString()]
    );
    return;
  }

  const marketOrder = createOrLoadMarketOrder(marketOrderId, event);
  marketOrder.status = PRICE_ORDER_STATUS.RECEIVED;
  log.info("[handleMarketOpenCanceled] Found market order {}", [
    marketOrder.id,
  ]);

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
  log.info("[handleMarketOpenCanceled] Updated trade {}", [trade.id]);

  // update state
  removePendingMarketOrder(orderId.toString());

  // save
  marketOrder.save();
  trade.save();
}
