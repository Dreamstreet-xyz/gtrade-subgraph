import { log } from "@graphprotocol/graph-ts";
import {
  getTradesState,
  generateOrderId,
  generateIdFromRawTradeTuple,
  addPendingMarketOrder,
  getOpenTradeId,
  createTraderIfDne,
} from "access/entity";
import { getStorageContract } from "access/contract";
import {
  TRADE_STATUS,
  TRADE_TYPE,
  PRICE_ORDER_STATUS,
  PRICE_ORDER_TYPE,
} from "constants/index";
import { MarketOrderInitiated } from "types/GNSTradingV6/GNSTradingV6";
import { Trade, MarketOrder, TradeInfo } from "types/schema";

/**
 * Event is emitted when a market order is initiated. Market order is a price order that can be placed
 * on open and/or close of a trade. This handles both scenarios, difference being whether
 * a new or existing Trade object is used.
 *
 * Basic flow:
 * a. create new MarketOrder obj
 * b. create new or update existing Trade obj
 * c. update contract state
 * d. associate MarketOrder with Trade obj
 *
 * @param event MarketOrderInitiated event
 */
export function handleMarketOrderInitiated(event: MarketOrderInitiated): void {
  const { trader, pairIndex, open, orderId } = event.params;

  createTraderIfDne(trader);

  // read storage contract state for trade details
  const storage = getStorageContract();

  // read pending market order from storage
  const cPendingMarketOrder = storage.reqID_pendingMarketOrder(orderId);
  const [_trade, block, wantedPrice, slippageP, spreadReductionP, tokenId] = [
    cPendingMarketOrder.value0,
    cPendingMarketOrder.value1,
    cPendingMarketOrder.value2,
    cPendingMarketOrder.value3,
    cPendingMarketOrder.value4,
    cPendingMarketOrder.value5,
  ];

  if (Number(_trade.leverage) === 0) {
    log.error(
      "[handleMarketOrderInitiated] No market order found in contract {}",
      [orderId.toString()]
    );
    return;
  }

  // construct MarketOrder object
  const marketOrderId = generateOrderId(
    event.transaction,
    event.logIndex,
    orderId
  );
  const marketOrder = new MarketOrder(marketOrderId);
  marketOrder.status = PRICE_ORDER_STATUS.REQUESTED;
  marketOrder.block = block;
  marketOrder.wantedPrice = wantedPrice;
  marketOrder.slippageP = slippageP;
  marketOrder.spreadReductionP = spreadReductionP;
  marketOrder.tokenId = tokenId;
  marketOrder.type = open
    ? PRICE_ORDER_TYPE.MARKET_OPEN
    : PRICE_ORDER_TYPE.MARKET_CLOSE;

  // read storage state
  let tradesState = getTradesState();

  if (open) {
    // construct Trade object
    const tradeId = generateIdFromRawTradeTuple(
      trader,
      pairIndex,
      _trade.index
    );
    const trade = new Trade(tradeId);
    trade.status = TRADE_STATUS.OPENING;
    trade.trader = trader.toHexString();
    trade.type = TRADE_TYPE.MARKET_TRADE;
    trade.pairIndex = _trade.pairIndex;
    trade.index = _trade.index;
    trade.positionSizeDai = _trade.positionSizeDai;
    trade.buy = _trade.buy;
    trade.leverage = _trade.leverage;
    trade.tp = _trade.tp;
    trade.sl = _trade.sl;

    // mo reference trade
    marketOrder.trade = trade.id;

    // save
    trade.save();
  } else {
    // retreive Trade object
    const tradeId = getOpenTradeId(tradesState, {
      trader,
      pairIndex,
      index: _trade.index,
    });
    const trade = Trade.load(tradeId);
    if (!trade) {
      log.error(
        "[handleMarketOrderInitiated] Could not load trade for market order {}",
        [orderId.toString()]
      );
      return;
    }

    // transition
    trade.status = TRADE_STATUS.CLOSING;

    // update trade info
    if (trade.tradeInfo) {
      const tradeInfo = new TradeInfo(trade.tradeInfo);
      tradeInfo.beingMarketClosed = true;
      tradeInfo.save();
    } else {
      log.warning(
        "[handleMarketOrderInitiated] trade.tradeInfo is null for market order {}",
        [orderId.toString()]
      );
    }

    // save
    trade.save();
  }

  // update state
  tradesState = addPendingMarketOrder(
    tradesState,
    orderId.toString(),
    marketOrderId,
    false
  );

  // save
  marketOrder.save();
  tradesState.save();
}
