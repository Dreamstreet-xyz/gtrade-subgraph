import { log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "../../../access/contract";
import {
  createOrLoadOpenLimitOrder,
  getOpenLimitOrderId,
  removeOpenLimitOrder,
} from "../../../access/entity";
import { OpenLimitCanceled } from "../../../types/GNSTradingV6/GNSTradingV6";
import { OpenLimitOrder, Trade } from "../../../types/schema";
import {
  OPEN_LIMIT_ORDER_STATUS,
  TRADE_STATUS,
} from "../../../helpers/constants";
import { stringifyTuple } from "../../../access/entity/trade/Trade";

/**
 * Event is emitted when an open limit order is canceled before it's been fulfilled.
 *
 * Basic flow:
 * a. update OpenLimitOrder obj
 * b. update Trade obj
 * c. update contract state
 *
 * @param event OpenLimitCanceled
 */
export function handleOpenLimitCanceled(event: OpenLimitCanceled): void {
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const index = event.params.index;

  log.info("[handleOpenLimitCanceled] Trader {}, PairIndex {}, Index {}", [
    trader.toHexString(),
    pairIndex.toString(),
    index.toString(),
  ]);

  // read OpenLimitOrder and update status
  const openLimitOrderId = getOpenLimitOrderId({
    trader,
    pairIndex,
    index,
  });
  if (!openLimitOrderId) {
    log.error(
      "[handleOpenLimitCanceled] OpenLimitOrder for tuple {} not found in state",
      [stringifyTuple({ trader, pairIndex, index })]
    );
    return;
  }
  const openLimitOrder = createOrLoadOpenLimitOrder(openLimitOrderId, event);
  openLimitOrder.status = OPEN_LIMIT_ORDER_STATUS.CANCELED;
  log.info("[handleOpenLimitCanceled] Updated OpenLimitOrder {}", [
    openLimitOrderId,
  ]);

  // update Trade status
  const trade = Trade.load(openLimitOrder.trade);
  if (!trade) {
    log.error(
      "[handleOpenLimitCanceled] Trade not found for OpenLimitOrder {}",
      [openLimitOrderId]
    );
    return;
  }
  trade.status = TRADE_STATUS.CANCELED;
  log.info("[handleOpenLimitCanceled] Updated Trade {}", [trade.id]);

  // update state
  removeOpenLimitOrder({ trader, pairIndex, index });

  // save
  openLimitOrder.save();
  trade.save();
}
