import { log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "../../../access/contract";
import {
  getOpenLimitOrderId,
  getTradesState,
  updateOpenLimitOrderFromContractObject,
  updateTradeFromOpenLimitOrderContractObject,
} from "../../../access/entity";
import { OpenLimitUpdated } from "../../../types/GNSTradingV6/GNSTradingV6";
import { OpenLimitOrder, Trade } from "../../../types/schema";

/**
 * Event is emitted when an open limit order is updated.
 *
 * Basic flow:
 * a. update OpenLimitOrder obj
 * b. update Trade obj
 * c. save
 *
 * @param event
 * @returns
 */
export function handleOpenLimitUpdated(event: OpenLimitUpdated): void {
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const index = event.params.index;

  const state = getTradesState();
  const storage = getStorageContract();

  // read OpenLimitOrder and update
  const openLimitOrderId = getOpenLimitOrderId(state, {
    trader,
    pairIndex,
    index,
  });
  let openLimitOrder = OpenLimitOrder.load(openLimitOrderId);
  if (!openLimitOrder) {
    log.error(
      "[handleOpenLimitUpdated] OpenLimitOrder {} not found for trader {} pairIndex {} index {}",
      [
        openLimitOrderId,
        trader.toHexString(),
        pairIndex.toHexString(),
        index.toHexString(),
      ]
    );
    return;
  }
  const cOpenLimitOrder = storage.getOpenLimitOrder(trader, pairIndex, index);
  openLimitOrder = updateOpenLimitOrderFromContractObject(
    openLimitOrder,
    cOpenLimitOrder,
    false
  );

  // read Trade and update
  let trade = Trade.load(openLimitOrder.trade);
  if (!trade) {
    log.error(
      "[handleOpenLimitUpdated] Trade {} not found for OpenLimitOrder {}",
      [openLimitOrder.id]
    );
    return;
  }
  trade = updateTradeFromOpenLimitOrderContractObject(
    trade,
    cOpenLimitOrder,
    false
  );

  // save
  openLimitOrder.save();
  trade.save();
}
