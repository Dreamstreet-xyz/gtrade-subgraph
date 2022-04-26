import { log, BigInt } from "@graphprotocol/graph-ts";
import { getStorageContract } from "../../../access/contract";
import {
  removePendingMarketOrder,
  generateTradeInfoId,
  updateTradeInfoFromContractObject,
  updateTradeFromContractObject,
  addOpenTrade,
  addOpenTradeInfo,
} from "../../../access/entity";
import {
  removeOpenTrade,
  removeOpenTradeInfo,
} from "../../../access/entity/trade/ContractIdMapping";
import { getPendingMarketOrderId } from "../../../access/entity/trade/ContractIdMapping/pendingMarketOrdersLookup";
import { PRICE_ORDER_STATUS, TRADE_STATUS } from "../../../helpers/constants";
import { MarketExecuted } from "../../../types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { MarketOrder, Trade, TradeInfo } from "../../../types/schema";

/**
 * Event is emitted when a market order trade is opened or closed following price details.
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
  const orderId = event.params.orderId;
  const t = event.params.t;
  const open = event.params.open;
  const price = event.params.price;
  const positionSizeDai = event.params.positionSizeDai;
  const percentProfit = event.params.percentProfit;
  log.info("[handleMarketExecuted] OrderId {}, Trader {}, Open {}", [
    orderId.toString(),
    t.trader.toHexString(),
    open ? "true" : "false",
  ]);

  const trader = t.trader;
  const pairIndex = t.pairIndex;
  const index = t.index;

  const storage = getStorageContract();

  // update MarketOrder
  const marketOrderId = getPendingMarketOrderId(orderId.toString());
  const marketOrder = MarketOrder.load(marketOrderId);
  if (!marketOrder) {
    log.error("[handleMarketExecuted] No market order found for orderId {}", [
      orderId.toString(),
    ]);
    return;
  }
  marketOrder.status = PRICE_ORDER_STATUS.RECEIVED;
  marketOrder.price = price;
  log.info("[handleMarketExecuted] Updated MarketOrder {}", [marketOrderId]);

  // update Trade
  let trade = Trade.load(marketOrder.trade);
  if (!trade) {
    log.error(
      "[handleMarketExecuted] No trade found for orderId {}, market order {}",
      [orderId.toString(), marketOrderId]
    );
    return;
  }

  if (open) {
    // should be able to use 't' from event but for certainty, reading state
    const cTrade = storage.openTrades(trader, pairIndex, index);
    trade = updateTradeFromContractObject(trade, cTrade, false);
    trade.status = TRADE_STATUS.OPEN;
    log.info("[handleMarketExecuted] Updated Trade {} to OPEN", [trade.id]);

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
    log.info(
      "[handleMarketExecuted] Fetched openTradesInfo from contract and created TradeInfo obj {}",
      [tradeInfoId]
    );

    // associate trade with trade info
    tradeInfo.trade = trade.id;
    trade.tradeInfo = tradeInfo.id;

    // update state
    addOpenTrade({ trader, pairIndex, index }, trade.id, true);
    addOpenTradeInfo({ trader, pairIndex, index }, tradeInfo.id, true);

    // save
    tradeInfo.save();
  } else {
    trade.status = TRADE_STATUS.CLOSED;
    trade.percentProfit = percentProfit;
    trade.closePrice = price;
    log.info("[handleMarketExecuted] Updated Trade {} to CLOSED", [trade.id]);

    // update trade info
    const tradeInfoId = trade.tradeInfo;
    if (tradeInfoId) {
      let tradeInfo = TradeInfo.load(tradeInfoId);
      if (!tradeInfo) {
        tradeInfo = new TradeInfo(tradeInfoId);
      }
      tradeInfo.beingMarketClosed = false;
      tradeInfo.save();
      log.info("[handleMarketOrderInitiated] Updated TradeInfo obj {}", [
        tradeInfoId,
      ]);
    } else {
      log.warning(
        "[handleMarketOrderInitiated] TradeInfo is null for OrderId {}, MarketOrder {}, Trade {}",
        [orderId.toString(), marketOrder.id, trade.id]
      );
    }

    // update state
    removeOpenTrade({ trader, pairIndex, index });
    removeOpenTradeInfo({ trader, pairIndex, index });
  }
  // update state
  removePendingMarketOrder(orderId.toString());

  // save
  marketOrder.save();
  trade.save();
}
