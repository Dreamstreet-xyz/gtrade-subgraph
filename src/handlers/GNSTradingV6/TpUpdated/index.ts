import { log } from "@graphprotocol/graph-ts";
import { TradeTuple } from "../../../access/entity/trade/Trade";
import { getStorageContract } from "../../../access/contract";
import {
  getTradesState,
  updateTradeAndTradeInfoToLatestFromTuple,
} from "../../../access/entity";
import { TpUpdated } from "../../../types/GNSTradingV6/GNSTradingV6";

/**
 * Event is emitted when a trade's take profit is updated.
 *
 * Basic flow:
 * a. update Trade obj
 * b. update TradeInfo obj
 *
 * @param event TpUpdated
 */
export function handleTpUpdated(event: TpUpdated): void {
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const index = event.params.index;

  const tuple: TradeTuple = { trader, pairIndex, index };

  const storage = getStorageContract();
  const state = getTradesState();

  try {
    updateTradeAndTradeInfoToLatestFromTuple(state, storage, tuple, true);
  } catch (e) {
    log.error(
      "[handleTpUpdated] Error updating trade and tradeInfo for tuple {}",
      [JSON.stringify(tuple)]
    );
  }
}
