import { log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "access/contract";
import {
  getTradesState,
  updateTradeAndTradeInfoToLatestFromTuple,
} from "access/entity";
import { SlUpdated } from "types/GNSTradingV6/GNSTradingV6";

/**
 * Event is emitted when a trade's stop loss is requested to be updated, and due to guaranteed SL rules on asset,
 * it's immediately granted.
 *
 * This event is not to be confused with GNSTradingCallbackV6.SlUpdated
 *
 * Basic flow:
 * a. update Trade obj
 * b. update TradeInfo obj
 *
 * @param event
 */
export function handleSlUpdated(event: SlUpdated): void {
  const { trader, pairIndex, index, newSl } = event.params;

  const tuple = { trader, pairIndex, index };

  const storage = getStorageContract();
  const state = getTradesState();

  try {
    updateTradeAndTradeInfoToLatestFromTuple(state, storage, tuple, true);
  } catch (e) {
    log.error(
      "[GNSTradingV6.handleSlUpdated] Error updating trade and tradeInfo for tuple {}",
      [JSON.stringify(tuple)]
    );
  }
}
