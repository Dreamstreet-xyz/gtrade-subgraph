import { log } from "@graphprotocol/graph-ts";
import { stringifyTuple, TradeTuple } from "../../../access/entity/trade/Trade";
import { getStorageContract } from "../../../access/contract";
import { getPriceAggregatorContract } from "../../../access/contract/GNSPriceAggregatorV6";
import {
  addPendingSlUpdateOrder,
  generateOrderId,
  getOpenTradeId,
  updateTradeFromContractObject,
  createOrLoadSlUpdateOrder,
} from "../../../access/entity";
import {
  PRICE_ORDER_STATUS,
  PRICE_ORDER_TYPE,
} from "../../../helpers/constants";
import { SlUpdateInitiated } from "../../../types/GNSTradingV6/GNSTradingV6";
import { SlUpdateOrder, Trade } from "../../../types/schema";

/**
 * Event is emitted when a trade's stop loss is requested to be updated, but because no guaranteed SL
 * is set for pair index, a request is made to the price aggregator to update.
 *
 * Basic flow:
 * a. update Trade obj
 * b. create new SlUpdateOrder obj
 * c. update contract state
 *
 * @param event
 * @returns
 */
export function handleSlUpdateInitiated(event: SlUpdateInitiated): void {
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const index = event.params.index;
  const newSl = event.params.newSl;
  const orderId = event.params.orderId;

  log.info(
    "[handleSlUpdateInitiated] Trader {}, PairIndex {}, Index {}, NewSL {}, OrderId {}",
    [
      trader.toHexString(),
      pairIndex.toString(),
      index.toString(),
      newSl.toString(),
      orderId.toString(),
    ]
  );

  const tuple: TradeTuple = { trader, pairIndex, index };

  const aggregator = getPriceAggregatorContract();
  const storage = getStorageContract();

  // fetch and update Trade
  const tradeId = getOpenTradeId(tuple);
  let trade = Trade.load(tradeId);
  if (!trade) {
    log.error("[handleSLUpdateInitiated] Trade {} not found for tuple {}", [
      tradeId,
      stringifyTuple(tuple),
    ]);
    return;
  }
  const cTradeResp = storage.try_openTrades(trader, pairIndex, index);
  if (cTradeResp.reverted) {
    log.error(
      "[handleSlUpdateInitiated] try_openTrades reverted call to chain, possible reorg. Tuple {}",
      [stringifyTuple({ trader, pairIndex, index })]
    );
    return;
  }
  const cTrade = cTradeResp.value;
  const tradeUpdate = updateTradeFromContractObject(trade, cTrade, false);
  if (!tradeUpdate) {
    log.error("[handleSLUpdateInitiated] Trade {} not updated for tuple {}", [
      tradeId,
      stringifyTuple(tuple),
    ]);
    return;
  }
  trade = tradeUpdate;
  log.info(
    "[handleSLUpdateInitiated] Fetched openTrades from contract and updated Trade obj {}",
    [tradeId]
  );

  // create SLUpdateOrder
  // instead of reading aggregator contract state,we just use the new SL since that's the only difference
  const slUpdateOrderId = generateOrderId(
    event.transaction,
    event.logIndex,
    orderId
  );
  const slUpdateOrder = createOrLoadSlUpdateOrder(slUpdateOrderId, event);
  slUpdateOrder.status = PRICE_ORDER_STATUS.REQUESTED;
  slUpdateOrder.trade = trade.id;
  slUpdateOrder.type = PRICE_ORDER_TYPE.UPDATE_SL;
  slUpdateOrder.newSl = newSl;
  slUpdateOrder.orderId = orderId;
  log.info("[handleSLUpdateInitiated] Created SlUpdateOrder obj {}", [
    slUpdateOrderId,
  ]);

  // update state
  addPendingSlUpdateOrder(orderId.toString(), slUpdateOrderId, true);

  // save
  slUpdateOrder.save();
  trade.save();
}
