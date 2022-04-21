import { log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "access/contract";
import {
  getTradesState,
  removePendingMarketOrder,
  generateTradeInfoId,
  updateTradeInfoFromContractObject,
  updateTradeFromContractObject,
  addOpenTrade,
  addOpenTradeInfo,
} from "access/entity";
import { getPendingMarketOrderId } from "access/entity/trade/ContractTradeState/pendingMarketOrdersLookup";
import { PRICE_ORDER_STATUS, TRADE_STATUS } from "constants/index";
import { MarketExecuted } from "types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { MarketOrder, Trade, TradeInfo } from "types/schema";

/**
 * Event is emitted when a market order trade is opened following price details.
 *
 * Basic flow:
 * a. transition MarketOrder to received
 * b. update Trade object with trade details and transition to open
 * c. create TradeInfo details
 * d. update state
 *
 * @param event MarketExecuted event
 */
export function handleMarketExecuted(event: MarketExecuted): void {
  const {
    orderId,
    t,
    open,
    price,
    positionSizeDai,
    percentProfit,
  } = event.params;

  const { trader, pairIndex, index } = t;

  let state = getTradesState();
  const storage = getStorageContract();

  // update MarketOrder
  const marketOrderId = getPendingMarketOrderId(state, orderId.toString());
  const marketOrder = MarketOrder.load(marketOrderId);
  if (!marketOrder) {
    log.error("[handleMarketExecuted] No market order found for orderId {}", [
      orderId.toString(),
    ]);
    return;
  }
  marketOrder.status = PRICE_ORDER_STATUS.RECEIVED;

  // update Trade
  let trade = Trade.load(marketOrder.trade);
  if (!trade) {
    log.error(
      "[handleMarketExecuted] No trade found for orderId {}, market order {}",
      [orderId.toString(), marketOrderId]
    );
    return;
  }
  // should be able to use 't' from event but for certainty, reading state
  const cTrade = storage.openTrades(trader, pairIndex, index);
  trade = updateTradeFromContractObject(trade, cTrade, false);
  trade.status = TRADE_STATUS.OPEN;

  const cTradeInfo = storage.openTradesInfo(trader, pairIndex, index);
  const tradeInfoId = generateTradeInfoId(event.transaction, event.logIndex, {
    trader,
    pairIndex,
    index,
  });
  const tradeInfo = updateTradeInfoFromContractObject(
    new TradeInfo(tradeInfoId),
    cTradeInfo,
    false
  );

  // associate trade with trade info
  tradeInfo.trade = trade.id;
  trade.tradeInfo = tradeInfo.id;

  // update state
  state = removePendingMarketOrder(state, orderId.toString(), false);
  state = addOpenTrade(state, { trader, pairIndex, index }, trade.id, false);
  state = addOpenTradeInfo(
    state,
    { trader, pairIndex, index },
    tradeInfo.id,
    false
  );

  // save
  marketOrder.save();
  trade.save();
  tradeInfo.save();
  state.save();
}
