import { BigInt, log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "access/contract";
import {
  getPendingMarketOrderId,
  getTradesState,
  updateTradeFromContractObject,
  removePendingMarketOrder,
} from "access/entity";
import {
  removeOpenTrade,
  removeOpenTradeInfo,
} from "access/entity/trade/ContractTradeState";
import {
  PRICE_ORDER_STATUS,
  TRADE_STATUS,
  ZERO_ADDRESS,
} from "constants/index";
import { MarketCloseCanceled } from "types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { MarketOrder, Trade } from "types/schema";

/**
 * Event is emitted when a market close order is canceled due to order details. This will keep
 * the trade open unless trade position size is smaller than the fee due for the order, in which
 * case it is closed out.
 *
 * Basic flow:
 * a. update MarketOrder obj
 * b. update Trade obj
 * c. update contract state
 *
 * @param event
 * @returns
 */
export function handleMarketCloseCanceled(event: MarketCloseCanceled): void {
  const { orderId, trader, pairIndex, index } = event.params;

  let state = getTradesState();
  const contract = getStorageContract();

  // set price of order to 0 as that is what is returened by the contract
  const price = BigInt.fromI32(0);

  // update MarketOrder
  const marketOrderId = getPendingMarketOrderId(state, orderId.toString());
  const marketOrder = MarketOrder.load(marketOrderId);
  if (!marketOrder) {
    log.error(
      "[handleMarketCloseCanceled] MarketOrder {} not found for orderId {}",
      [marketOrderId, orderId.toString()]
    );
    return;
  }
  marketOrder.status = PRICE_ORDER_STATUS.RECEIVED;
  marketOrder.price = price;

  // update Trade
  let trade = Trade.load(marketOrder.trade);
  if (!trade) {
    log.error("[handleMarketCloseCanceled] Trade {} not found for orderId {}", [
      marketOrder.trade,
      orderId.toString(),
    ]);
    return;
  }

  // check if trade is still open in contract
  // if the trade position size was smaller than the feed owed for price order,
  // then it is automatically closed, otherwise it's still open
  const cTrade = contract.openTrades(trader, pairIndex, index);
  if (cTrade && cTrade.value0.toHexString() !== ZERO_ADDRESS) {
    // update whole object from contract
    trade = updateTradeFromContractObject(trade, cTrade, false);
  } else {
    // trade is closed
    trade.status = TRADE_STATUS.CLOSED;
    trade.percentProfit = BigInt.fromI32(-100);
    trade.closePrice = price;
  }

  // update state
  if (!cTrade || cTrade.value0.toHexString() === ZERO_ADDRESS) {
    state = removeOpenTrade(state, { trader, pairIndex, index }, false);
    state = removeOpenTradeInfo(state, { trader, pairIndex, index }, false);
  }
  state = removePendingMarketOrder(state, orderId.toString(), false);

  // save
  marketOrder.save();
  trade.save();
  state.save();
}
