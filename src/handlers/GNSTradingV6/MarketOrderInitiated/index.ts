import { log } from "@graphprotocol/graph-ts";
import {
  generateOrderId,
  addPendingMarketOrder,
  getOpenTradeId,
  createOrLoadTrader,
  generateTradeId,
  createOrLoadTradeInfo,
  createOrLoadMarketOrder,
  createOrLoadTrade,
} from "../../../access/entity";
import { getStorageContract } from "../../../access/contract";
import {
  TRADE_STATUS,
  TRADE_TYPE,
  PRICE_ORDER_STATUS,
  PRICE_ORDER_TYPE,
  ZERO_ADDRESS,
} from "../../../helpers/constants";
import { MarketOrderInitiated } from "../../../types/GNSTradingV6/GNSTradingV6";
import { Trade, MarketOrder, TradeInfo } from "../../../types/schema";
import { stringifyTuple } from "../../../access/entity/trade/Trade";

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
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const open = event.params.open;
  const orderId = event.params.orderId;

  log.info(
    "[handleMarketOrderInitiated] OrderId {}, Trader {}, PairIndex {}, Open {}",
    [
      orderId.toString(),
      trader.toHexString(),
      pairIndex.toString(),
      open ? "true" : "false",
    ]
  );

  createOrLoadTrader(trader, event.block);

  // read storage contract state for trade details
  const storage = getStorageContract();

  // read pending market order from storage
  const cPendingMarketOrder = storage.reqID_pendingMarketOrder(orderId);
  const _trade = cPendingMarketOrder.value0;
  const block = cPendingMarketOrder.value1;
  const wantedPrice = cPendingMarketOrder.value2;
  const slippageP = cPendingMarketOrder.value3;
  const spreadReductionP = cPendingMarketOrder.value4;
  const tokenId = cPendingMarketOrder.value5;
  log.info(
    "[handleMarketOrderInitiated] Fetched pendingMarketOrder from contract",
    []
  );

  if (_trade.trader.toHexString() == ZERO_ADDRESS) {
    log.error(
      "[handleMarketOrderInitiated] No market order found in contract orderId: {}, trader: {}",
      [orderId.toString(), _trade.trader.toHexString()]
    );
    return;
  }

  // construct MarketOrder object
  const marketOrderId = generateOrderId(
    event.transaction,
    event.logIndex,
    orderId
  );
  const marketOrder = createOrLoadMarketOrder(marketOrderId, event);
  marketOrder.status = PRICE_ORDER_STATUS.REQUESTED;
  marketOrder.block = block;
  marketOrder.wantedPrice = wantedPrice;
  marketOrder.slippageP = slippageP;
  marketOrder.spreadReductionP = spreadReductionP;
  marketOrder.tokenId = tokenId.toI32();
  marketOrder.type = open
    ? PRICE_ORDER_TYPE.MARKET_OPEN
    : PRICE_ORDER_TYPE.MARKET_CLOSE;
  marketOrder.orderId = orderId;
  log.info("[handleMarketOrderInitiated] Created MarketOrder obj {}", [
    marketOrderId,
  ]);

  if (open) {
    // construct Trade object
    const tradeId = generateTradeId(event.transaction, event.logIndex, {
      trader,
      pairIndex,
      index: _trade.index,
    });
    const trade = createOrLoadTrade(tradeId, event.block);
    trade.status = TRADE_STATUS.OPENING;
    trade.trader = trader.toHexString();
    trade.type = TRADE_TYPE.MARKET_TRADE;
    trade.pairIndex = _trade.pairIndex.toI32();
    trade.index = _trade.index.toI32();
    trade.positionSizeDai = _trade.positionSizeDai;
    trade.buy = _trade.buy;
    trade.leverage = _trade.leverage.toI32();
    trade.tp = _trade.tp;
    trade.sl = _trade.sl;

    // mo reference trade
    marketOrder.trade = trade.id;

    // save
    trade.save();
    log.info("[handleMarketOrderInitiated] Created Trade obj {}", [tradeId]);
  } else {
    // retreive Trade object
    const tradeId = getOpenTradeId({
      trader,
      pairIndex,
      index: _trade.index,
    });

    if (!tradeId) {
      log.error(
        "[handleMarketOrderInitiated] Open trade ID not found for OrderId: {}, Tuple: {}",
        [
          orderId.toString(),
          stringifyTuple({ trader, pairIndex, index: _trade.index }),
        ]
      );
      return;
    }

    const trade = Trade.load(tradeId);
    if (!trade) {
      log.error(
        "[handleMarketOrderInitiated] Could not load Trade for OrderId {}, MarketOrder {}, {}",
        [
          orderId.toString(),
          marketOrder.id,
          stringifyTuple({
            trader,
            pairIndex,
            index: _trade.index,
          }),
        ]
      );
      return;
    }

    // transition
    trade.status = TRADE_STATUS.CLOSING;
    log.info("[handleMarketOrderInitiated] Transitioned Trade obj {}", [
      tradeId,
    ]);

    // update trade info
    const tradeInfoId = trade.tradeInfo;
    if (tradeInfoId) {
      const tradeInfo = createOrLoadTradeInfo(tradeInfoId, event.block);
      tradeInfo.beingMarketClosed = true;
      tradeInfo.save();
      log.info("[handleMarketOrderInitiated] Updated TradeInfo obj {}", [
        tradeInfoId,
      ]);
    } else {
      log.warning(
        "[handleMarketOrderInitiated] trade.tradeInfo is null for market order {} and trade {}",
        [orderId.toString(), trade.id]
      );
    }

    // associate market order with trade
    marketOrder.trade = trade.id;

    // save
    trade.save();
  }

  // update state
  addPendingMarketOrder(orderId.toString(), marketOrderId, true);

  // save
  marketOrder.save();
}
