import { BigInt, log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "../../../access/contract";
import {
  getPendingMarketOrderId,
  updateTradeFromContractObject,
  removePendingMarketOrder,
} from "../../../access/entity";
import {
  removeOpenTrade,
  removeOpenTradeInfo,
} from "../../../access/entity/trade/ContractIdMapping";
import {
  PRICE_ORDER_STATUS,
  TRADE_STATUS,
  ZERO_ADDRESS,
} from "../../../helpers/constants";
import { MarketCloseCanceled } from "../../../types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { MarketOrder, Trade } from "../../../types/schema";

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
  const orderId = event.params.orderId;
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const index = event.params.index;

  log.info("[handleMarketCloseCanceled] OrderId {}, Trader {}", [
    orderId.toString(),
    trader.toHexString(),
  ]);

  const contract = getStorageContract();

  // set price of order to 0 as that is what is returened by the contract
  const price = BigInt.fromI32(0);

  // update MarketOrder
  const marketOrderId = getPendingMarketOrderId(orderId.toString());
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
  log.info("[handleMarketCloseCanceled] Updated MarketOrder {}", [
    marketOrderId,
  ]);

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
    log.info("[handleMarketCloseCanceled] Trade is still open", []);
    // update whole object from contract
    trade = updateTradeFromContractObject(trade, cTrade, false);
  } else {
    log.info("[handleMarketCloseCanceled] Trade is closed", []);
    // trade is closed
    trade.status = TRADE_STATUS.CLOSED;
    trade.percentProfit = BigInt.fromI32(-100);
    trade.closePrice = price;
  }
  log.info("[handleMarketCloseCanceled] Updated Trade {}", [trade.id]);

  // update state
  if (!cTrade || cTrade.value0.toHexString() === ZERO_ADDRESS) {
    removeOpenTrade({ trader, pairIndex, index });
    removeOpenTradeInfo({ trader, pairIndex, index });
  }

  removePendingMarketOrder(orderId.toString());

  // save
  marketOrder.save();
  trade.save();
}
