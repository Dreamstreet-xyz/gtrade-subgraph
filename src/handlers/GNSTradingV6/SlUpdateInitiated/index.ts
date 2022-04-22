import { log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "access/contract";
import { getPriceAggregatorContract } from "access/contract/GNSPriceAggregatorV6";
import {
  addPendingSlUpdateOrder,
  generateOrderId,
  getOpenTradeId,
  getTradesState,
  updateTradeFromContractObject,
} from "access/entity";
import { PRICE_ORDER_STATUS, PRICE_ORDER_TYPE } from "constants/index";
import { SlUpdateInitiated } from "types/GNSTradingV6/GNSTradingV6";
import { SlUpdateOrder, Trade } from "types/schema";

/**
 * Event is emitted when a trade's stop loss is requested to be updated, but because no guaranteed SL
 * is set for pair index, a request is made to the price aggregator to update.
 *
 * Basic flow:
 * a. update Trade obj
 * b. create new SlUpdateOrder obj
 * c. update contract state
 *
 * @param event
 * @returns
 */
export function handleSlUpdateInitiated(event: SlUpdateInitiated): void {
  const { trader, pairIndex, index, newSl, orderId } = event.params;

  const tuple = { trader, pairIndex, index };

  const aggregator = getPriceAggregatorContract();
  const storage = getStorageContract();
  let state = getTradesState();

  // fetch and update Trade
  const tradeId = getOpenTradeId(state, tuple);
  let trade = Trade.load(tradeId);
  if (!trade) {
    log.error("[handleSLUpdateInitiated] Trade {} not found for tuple {}", [
      tradeId,
      JSON.stringify(tuple),
    ]);
    return;
  }
  const cTrade = storage.openTrades(trader, pairIndex, index);
  trade = updateTradeFromContractObject(trade, cTrade, false);

  // create SLUpdateOrder
  // instead of reading aggregator contract state,we just use the new SL since that's the only difference
  const slUpdateOrderId = generateOrderId(
    event.transaction,
    event.logIndex,
    orderId
  );
  const slUpdateOrder = new SlUpdateOrder(slUpdateOrderId);
  slUpdateOrder.status = PRICE_ORDER_STATUS.REQUESTED;
  slUpdateOrder.trade = trade.id;
  slUpdateOrder.type = PRICE_ORDER_TYPE.UPDATE_SL;
  slUpdateOrder.newSl = newSl;

  // update state
  state = addPendingSlUpdateOrder(
    state,
    orderId.toHexString(),
    slUpdateOrderId,
    false
  );

  // save
  slUpdateOrder.save();
  trade.save();
  state.save();
}
