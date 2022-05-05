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
  createOrLoadTradeInfo,
  transitionTradeToOpen,
  transitionTradeToClose,
  createOrLoadNftOrder,
  createOrLoadOpenLimitOrder,
} from "../../../access/entity";
import {
  removeOpenTrade,
  removeOpenTradeInfo,
} from "../../../access/entity/trade/ContractIdMapping";
import {
  LIMIT_ORDER_TYPE,
  LIMIT_ORDER_TYPE_IX,
  OPEN_LIMIT_ORDER_STATUS,
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

  const openLimitTuple: TradeTuple = { trader, pairIndex, index: limitIndex };
  const tuple: TradeTuple = { trader, pairIndex, index };

  log.info("[handleLimitExecuted] OrderId {}, Trader {}, LimitOrderType {}", [
    orderId.toString(),
    trader.toHexString(),
    LIMIT_ORDER_TYPE_IX[orderType],
  ]);

  const storage = getStorageContract();

  // update NFTOrder
  // set status to RECEIVED
  const nftOrderId = getPendingNftOrderId(orderId.toString());
  if (!nftOrderId) {
    log.error(
      "[handleLimitExecuted] NftOrder for OrderId {} not found in state",
      [orderId.toString()]
    );
    return;
  }
  const nftOrder = createOrLoadNftOrder(nftOrderId, event);
  nftOrder.status = PRICE_ORDER_STATUS.RECEIVED;
  nftOrder.price = price;
  log.info("[handleLimitExecuted] Updated NftOrder {}", [nftOrderId]);

  // opening trade
  if (LIMIT_ORDER_TYPE_IX[orderType] == LIMIT_ORDER_TYPE.OPEN) {
    log.info(
      "[handleLimitExecuted] OpenLimitOrder was executed, finding for tuple {}, {}, {}",
      [trader.toHexString(), pairIndex.toString(), index.toString()]
    );
    // update OpenLimitOrder
    // assign NftOrder to OpenLimitOrder
    const openLimitOrderId = getOpenLimitOrderId(openLimitTuple);
    if (!openLimitOrderId) {
      log.error(
        "[handleOpenLimitCanceled] OpenLimitOrder for tuple {} not found in state",
        [stringifyTuple({ trader, pairIndex, index })]
      );
      return;
    }
    const openLimitOrder = createOrLoadOpenLimitOrder(openLimitOrderId, event);
    openLimitOrder.nftOrder = nftOrderId;
    openLimitOrder.status = OPEN_LIMIT_ORDER_STATUS.FULFILLED;

    log.info("[handleLimitExecuted] Updated OpenLimitOrder {}", [
      openLimitOrderId,
    ]);

    // sanity check Trade references
    if (nftOrder.trade != openLimitOrder.trade) {
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
    const cTradeResp = storage.try_openTrades(trader, pairIndex, index);
    if (cTradeResp.reverted) {
      log.error(
        "[handleLimitExecuted] try_openTrades reverted call to chain, possible reorg. Tuple {}",
        [stringifyTuple({ trader, pairIndex, index })]
      );
      return;
    }
    const cTrade = cTradeResp.value;
    trade = updateTradeFromContractObject(trade, cTrade, false);
    trade = transitionTradeToOpen(trade, positionSizeDai, price, false);
    log.info(
      "[handleLimitExecuted] Fetched openTrades from contract and updated Trade obj {}",
      [trade.id]
    );

    const cTradeInfoResp = storage.try_openTradesInfo(trader, pairIndex, index);
    if (cTradeInfoResp.reverted) {
      log.error(
        "[handleLimitExecuted] try_openTradesInfo reverted call to chain, possible reorg. Tuple {}",
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
      "[handleLimitExecuted] Fetched openTradesInfo from contract and created TradeInfo obj {}",
      [tradeInfoId]
    );

    // associate trade with trade info
    tradeInfo.trade = trade.id;
    trade.tradeInfo = tradeInfo.id;

    // update state
    addOpenTrade(tuple, trade.id, true);
    addOpenTradeInfo(tuple, tradeInfo.id, true);

    removeOpenLimitOrder(openLimitTuple);

    // save
    trade.save();
    tradeInfo.save();
    openLimitOrder.save();
  } else {
    log.info("[handleLimitExecuted] Trade {} was closed, updating", [
      nftOrder.trade,
    ]);
    // close Trade
    // update Trade
    let trade = Trade.load(nftOrder.trade);
    if (!trade) {
      log.error("[handleLimitExecuted] Trade {} not found for NftOrder {}", [
        nftOrder.trade,
        nftOrder.id,
      ]);
      return;
    }
    trade = transitionTradeToClose(
      trade,
      percentProfit,
      price,
      event.transaction,
      false
    );

    log.info("[handleLimitExecuted] Updated Trade {} to CLOSED", [trade.id]);

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
