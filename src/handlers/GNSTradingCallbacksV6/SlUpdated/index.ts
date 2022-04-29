import { log } from "@graphprotocol/graph-ts";
import { stringifyTuple, TradeTuple } from "../../../access/entity/trade/Trade";
import { getStorageContract } from "../../../access/contract";
import {
  createOrLoadSlUpdateOrder,
  getPendingSlUpdateOrderId,
  removePendingSlUpdateOrder,
  updateTradeAndTradeInfoToLatestFromTuple,
} from "../../../access/entity";
import { PRICE_ORDER_STATUS } from "../../../helpers/constants";
import { SlUpdated } from "../../../types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { SlUpdateOrder } from "../../../types/schema";

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
  const orderId = event.params.orderId;
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const index = event.params.index;
  const newSl = event.params.newSl;

  log.info(
    "[handleSlUpdated] OrderId {}, Trader {}, PairIndex {}, Index {}, NewSl {}",
    [
      orderId.toString(),
      trader.toHexString(),
      pairIndex.toString(),
      index.toString(),
      newSl.toString(),
    ]
  );

  const tuple: TradeTuple = { trader, pairIndex, index };

  const storage = getStorageContract();

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
  log.info("[handleSlUpdated] Updated SlUpdateOrder {}", [slUpdateOrderId]);

  // update state
  removePendingSlUpdateOrder(orderId.toString());
  updateTradeAndTradeInfoToLatestFromTuple(storage, tuple, true);

  // save
  slUpdateOrder.save();
}
