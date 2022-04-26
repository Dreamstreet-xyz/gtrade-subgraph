import { log } from "@graphprotocol/graph-ts";
import { stringifyTuple, TradeTuple } from "../../../access/entity/trade/Trade";
import { getStorageContract } from "../../../access/contract";
import { updateTradeAndTradeInfoToLatestFromTuple } from "../../../access/entity";
import { SlUpdated } from "../../../types/GNSTradingV6/GNSTradingV6";

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
 * @param event SlUpdated
 */
export function handleSlUpdated(event: SlUpdated): void {
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const index = event.params.index;

  log.info("[handleSlUpdated] Trader {}, PairIndex {}, Index {}", [
    trader.toHexString(),
    pairIndex.toString(),
    index.toString(),
  ]);

  const tuple: TradeTuple = { trader, pairIndex, index };

  const storage = getStorageContract();

  updateTradeAndTradeInfoToLatestFromTuple(storage, tuple, true);
}
