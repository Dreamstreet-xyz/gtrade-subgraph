import { log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "access/contract";
import {
  addOpenTrade,
  addOpenTradeInfo,
  generateTradeInfoId,
  getPendingNftOrderId,
  getOpenLimitOrderId,
  getTradesState,
  removePendingNftOrder,
  removeOpenLimitOrder,
  updateTradeFromContractObject,
  updateTradeInfoFromContractObject,
} from "access/entity";
import {
  removeOpenTrade,
  removeOpenTradeInfo,
} from "access/entity/trade/ContractTradeState";
import {
  LIMIT_ORDER,
  LIMIT_ORDER_IX,
  PRICE_ORDER_STATUS,
  TRADE_STATUS,
} from "constants/index";
import { LimitExecuted } from "types/GNSTradingCallbacksV6/GNSTradingCallbacksV6";
import { NftOrder, OpenLimitOrder, Trade, TradeInfo } from "types/schema";

export function handleLimitExecuted(event: LimitExecuted): void {
  const {
    orderId,
    limitIndex,
    t,
    nftHolder,
    orderType,
    price,
    positionSizeDai,
    percentProfit,
  } = event.params;

  const { trader, pairIndex, index } = t;
  const tuple = { trader, pairIndex, index };

  let state = getTradesState();
  const storage = getStorageContract();

  // update NFTOrder
  // set status to RECEIVED
  const nftOrderId = getPendingNftOrderId(state, orderId.toString());
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

  // opening trade
  if (LIMIT_ORDER_IX[orderType] === LIMIT_ORDER.OPEN) {
    // update OpenLimitOrder
    // assign NftOrder to OpenLimitOrder
    const openLimitOrderId = getOpenLimitOrderId(state, tuple);
    const openLimitOrder = OpenLimitOrder.load(openLimitOrderId);
    if (!openLimitOrder) {
      log.error(
        "[handleLimitExecuted] OpenLimitOrder {} not found for tuple {}",
        [openLimitOrderId, JSON.stringify(tuple)]
      );
      return;
    }
    openLimitOrder.nftOrder = nftOrderId;

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
    state = addOpenTrade(state, tuple, trade.id, false);
    state = addOpenTradeInfo(state, tuple, tradeInfo.id, false);
    state = removeOpenLimitOrder(state, tuple, false);

    // save
    trade.save();
    tradeInfo.save();
  } else {
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

    // update state
    state = removeOpenTrade(state, tuple, false);
    state = removeOpenTradeInfo(state, tuple, false);

    // save
    trade.save();
  }

  state = removePendingNftOrder(state, orderId.toString(), false);

  // save
  nftOrder.save();
  state.save();
}
