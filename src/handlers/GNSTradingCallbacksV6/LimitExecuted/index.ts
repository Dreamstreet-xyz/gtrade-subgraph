import { log } from "@graphprotocol/graph-ts";
import { stringifyTuple, TradeTuple } from "../../../access/entity/trade/Trade";
import { getStorageContract } from "../../../access/contract";
import {
  addOpenTrade,
  addOpenTradeInfo,
  generateTradeInfoId,
  getPendingNftOrderId,
  getOpenLimitOrderId,
  removePendingNftOrder,
  removeOpenLimitOrder,
  updateTradeFromContractObject,
  updateTradeInfoFromContractObject,
} from "../../../access/entity";
import {
  removeOpenTrade,
  removeOpenTradeInfo,
} from "../../../access/entity/trade/ContractIdMapping";
import {
  LIMIT_ORDER_TYPE,
  LIMIT_ORDER_TYPE_IX,
  PRICE_ORDER_STATUS,
  TRADE_STATUS,
} from "../../../helpers/constants";
import { LimitExecuted } from "../../../types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import {
  NftOrder,
  OpenLimitOrder,
  Trade,
  TradeInfo,
} from "../../../types/schema";

export function handleLimitExecuted(event: LimitExecuted): void {
  const orderId = event.params.orderId;
  const limitIndex = event.params.limitIndex;
  const t = event.params.t;
  const nftHolder = event.params.nftHolder;
  const orderType = event.params.orderType;
  const price = event.params.price;
  const positionSizeDai = event.params.positionSizeDai;
  const percentProfit = event.params.percentProfit;

  const trader = t.trader;
  const pairIndex = t.pairIndex;
  const index = t.index;

  const tuple: TradeTuple = { trader, pairIndex, index };

  log.info("[handleLimitExecuted] OrderId {}, Trader {}", [
    orderId.toString(),
    trader.toHexString(),
  ]);

  const storage = getStorageContract();

  // update NFTOrder
  // set status to RECEIVED
  const nftOrderId = getPendingNftOrderId(orderId.toString());
  const nftOrder = NftOrder.load(nftOrderId);
  if (!nftOrder) {
    log.error("[handleLimitExecuted] NftOrder {} not found for orderId {}", [
      nftOrderId,
      orderId.toString(),
    ]);
    return;
  }
  nftOrder.status = PRICE_ORDER_STATUS.RECEIVED;
  nftOrder.price = price;
  log.info("[handleLimitExecuted] Updated NftOrder {}", [nftOrderId]);

  // opening trade
  if (LIMIT_ORDER_TYPE_IX[orderType] === LIMIT_ORDER_TYPE.OPEN) {
    log.info(
      "[handleLimitExecuted] OpenLimitOrder was executed, finding for tuple {}, {}, {}",
      [trader.toHexString(), pairIndex.toString(), index.toString()]
    );
    // update OpenLimitOrder
    // assign NftOrder to OpenLimitOrder
    const openLimitOrderId = getOpenLimitOrderId(tuple);
    const openLimitOrder = OpenLimitOrder.load(openLimitOrderId);
    if (!openLimitOrder) {
      log.error(
        "[handleLimitExecuted] OpenLimitOrder {} not found for tuple {}",
        [openLimitOrderId, stringifyTuple(tuple)]
      );
      return;
    }
    openLimitOrder.nftOrder = nftOrderId;
    log.info("[handleLimitExecuted] Updated OpenLimitOrder {}", [
      openLimitOrderId,
    ]);

    // sanity check Trade references
    if (nftOrder.trade !== openLimitOrder.trade) {
      log.error(
        "[handleLimitExecuted] Mismatch between NftOrder and OpenLimitOrder trade references, {}/{} | {}/{}",
        [nftOrder.trade, openLimitOrder.trade, nftOrder.id, openLimitOrder.id]
      );
      return;
    }
    // update Trade
    let trade = Trade.load(nftOrder.trade);
    if (!trade) {
      log.error("[handleLimitExecuted] Trade {} not found for NftOrder {}", [
        nftOrder.trade,
        nftOrder.id,
      ]);
      return;
    }
    const cTrade = storage.openTrades(trader, pairIndex, index);
    trade = updateTradeFromContractObject(trade, cTrade, false);
    trade.status = TRADE_STATUS.OPEN;
    trade.openPrice = price;
    log.info(
      "[handleLimitExecuted] Fetched openTrades from contract and updated Trade obj {}",
      [trade.id]
    );

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
      "[handleLimitExecuted] Fetched openTradesInfo from contract and created TradeInfo obj {}",
      [tradeInfoId]
    );

    // associate trade with trade info
    tradeInfo.trade = trade.id;
    trade.tradeInfo = tradeInfo.id;

    // update state
    addOpenTrade(tuple, trade.id, true);
    addOpenTradeInfo(tuple, tradeInfo.id, true);

    removeOpenLimitOrder(tuple);

    // save
    trade.save();
    tradeInfo.save();
  } else {
    log.info("[handleLimitExecuted] Trade {} was closed, updating", [
      nftOrder.trade,
    ]);
    // close Trade
    // update Trade
    const trade = Trade.load(nftOrder.trade);
    if (!trade) {
      log.error("[handleLimitExecuted] Trade {} not found for NftOrder {}", [
        nftOrder.trade,
        nftOrder.id,
      ]);
      return;
    }
    trade.status = TRADE_STATUS.CLOSED;
    trade.positionSizeDai = positionSizeDai;
    trade.percentProfit = percentProfit;
    trade.closePrice = price;
    log.info("[handleLimitExecuted] Updated Trade {}", [trade.id]);

    // update state
    removeOpenTrade(tuple);
    removeOpenTradeInfo(tuple);

    // save
    trade.save();
  }

  removePendingNftOrder(orderId.toString());

  // save
  nftOrder.save();
}
