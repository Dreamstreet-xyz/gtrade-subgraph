import { log, BigInt } from "@graphprotocol/graph-ts";
import { getStorageContract } from "../../../access/contract";
import {
  removePendingMarketOrder,
  generateTradeInfoId,
  updateTradeInfoFromContractObject,
  updateTradeFromContractObject,
  addOpenTrade,
  addOpenTradeInfo,
  createOrLoadTradeInfo,
  transitionTradeToOpen,
  transitionTradeToClose,
  createOrLoadMarketOrder,
} from "../../../access/entity";
import {
  removeOpenTrade,
  removeOpenTradeInfo,
} from "../../../access/entity/trade/ContractIdMapping";
import { getPendingMarketOrderId } from "../../../access/entity/trade/ContractIdMapping/pendingMarketOrdersLookup";
import { stringifyTuple } from "../../../access/entity/trade/Trade";
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
  if (!marketOrderId) {
    log.error(
      "[handleMarketOpenCanceled] MarketOrder for OrderId {} not found in state",
      [orderId.toString()]
    );
    return;
  }

  const marketOrder = createOrLoadMarketOrder(marketOrderId, event);
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
    const cTradeResp = storage.try_openTrades(trader, pairIndex, index);
    if (cTradeResp.reverted) {
      log.error(
        "[handleMarketExecuted] try_openTrades reverted call to chain, possible reorg. Tuple {}",
        [stringifyTuple({ trader, pairIndex, index })]
      );
      return;
    }
    const cTrade = cTradeResp.value;
    trade = updateTradeFromContractObject(trade, cTrade, false);
    trade = transitionTradeToOpen(trade, positionSizeDai, price, false);
    log.info("[handleMarketExecuted] Updated Trade {} to OPEN", [trade.id]);

    const cTradeInfoResp = storage.try_openTradesInfo(trader, pairIndex, index);
    if (cTradeInfoResp.reverted) {
      log.error(
        "[handleMarketExecuted] try_openTradesInfo reverted call to chain, possible reorg. Tuple {}",
        [stringifyTuple({ trader, pairIndex, index })]
      );
      return;
    }
    const cTradeInfo = cTradeInfoResp.value;
    const tradeInfoId = generateTradeInfoId(event.transaction, event.logIndex, {
      trader,
      pairIndex,
      index,
    });
    const tradeInfo = updateTradeInfoFromContractObject(
      createOrLoadTradeInfo(tradeInfoId, event.block),
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
    // transition to close and handle closing calculations
    trade = transitionTradeToClose(
      trade,
      percentProfit,
      price,
      event.transaction,
      false
    );
    log.info("[handleMarketExecuted] Updated Trade {} to CLOSED", [trade.id]);

    // update trade info
    const tradeInfoId = trade.tradeInfo;
    if (tradeInfoId) {
      const tradeInfo = createOrLoadTradeInfo(tradeInfoId, event.block);
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
