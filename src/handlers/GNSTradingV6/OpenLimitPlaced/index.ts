import { log } from "@graphprotocol/graph-ts";
import {
  generateOrderId,
  generateTradeId,
  updateOpenLimitOrderFromContractObject,
  updateTradeFromOpenLimitOrderContractObject,
  addOpenLimitOrder,
  createOrLoadTrader,
  createOrLoadTrade,
  createOrLoadOpenLimitOrder,
} from "../../../access/entity";
import { getStorageContract } from "../../../access/contract";
import {
  OPEN_LIMIT_ORDER_STATUS,
  OPEN_LIMIT_ORDER_TYPE_IX,
  TRADE_STATUS,
  TRADE_TYPE,
} from "../../../helpers/constants";
import { OpenLimitPlaced } from "../../../types/GNSTradingV6/GNSTradingV6";
import { OpenLimitOrder, Trade } from "../../../types/schema";
import { getNftRewardsContract } from "../../../access/contract/GNSNftRewardsV6";
import { stringifyTuple } from "../../../access/entity/trade/Trade";

/**
 * Event is emitted when an open limit order is placed. Open limit order is placed
 * when requesting to open a trade at a specified price.
 *
 * Basic flow:
 * a. create new OpenLimitOrder obj
 * b. create new Trade obj
 * c. update contract state
 * d. associate OpenLimitOrder with Trade obj
 *
 * @param event OpenLimitPlaced event
 */
export function handleOpenLimitPlaced(event: OpenLimitPlaced): void {
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const index = event.params.index;

  log.info("[handleOpenLimitPlaced] Trader {}, pairIndex {}, index {}", [
    trader.toHexString(),
    pairIndex.toString(),
    index.toString(),
  ]);

  createOrLoadTrader(trader, event.block);

  // read storage contract state for trade details
  const storage = getStorageContract();

  // get open limit order id
  // id is only locally unique to currently open limit orders
  const cOpenLimitOrderIdResp = storage.try_openLimitOrderIds(
    trader,
    pairIndex,
    index
  );
  if (cOpenLimitOrderIdResp.reverted) {
    log.error(
      "[handleOpenLimitPlaced] try_openLimitOrderIds reverted call to chain, possible reorg. Tuple {}",
      [stringifyTuple({ trader, pairIndex, index })]
    );
    return;
  }
  const cOpenLimitOrderId = cOpenLimitOrderIdResp.value;
  // get open limit order
  const cOpenLimitOrderResp = storage.try_getOpenLimitOrder(
    trader,
    pairIndex,
    index
  );
  if (cOpenLimitOrderResp.reverted) {
    log.error(
      "[handleOpenLimitPlaced] try_getOpenLimitOrder reverted call to chain, possible reorg. Tuple {}",
      [stringifyTuple({ trader, pairIndex, index })]
    );
    return;
  }
  const cOpenLimitOrder = cOpenLimitOrderResp.value;
  log.info(
    "[handleOpenLimitPlaced] Fetched openLimitOrderId from contract {}",
    [cOpenLimitOrderId.toString()]
  );

  // construct OpenLimitOrder
  const openLimitOrderId = generateOrderId(
    event.transaction,
    event.logIndex,
    cOpenLimitOrderId
  );
  const openLimitOrderUpdate = updateOpenLimitOrderFromContractObject(
    createOrLoadOpenLimitOrder(openLimitOrderId, event),
    cOpenLimitOrder,
    false
  );
  if (!openLimitOrderUpdate) {
    log.error(
      "[handleOpenLimitPlaced] Failed to update OpenLimitOrder from contract object {}",
      [openLimitOrderId]
    );
    return;
  }
  const openLimitOrder = openLimitOrderUpdate;
  openLimitOrder.status = OPEN_LIMIT_ORDER_STATUS.OPEN;
  log.info("[handleOpenLimitPlaced] Constructed OpenLimitOrder {}", [
    openLimitOrderId,
  ]);

  // const txInput = ethereum.decode(
  //   "((address, uint256, uint256, uint256, uint256, uint256, bool, uint256, uint256, uint256),tuple, uint8, uint256, uint256, address)",
  //   event.transaction.input
  // );
  const cType = getNftRewardsContract().openLimitOrderTypes(
    trader,
    pairIndex,
    index
  );
  openLimitOrder.type = OPEN_LIMIT_ORDER_TYPE_IX[cType];
  log.info(
    "[handleOpenLimitPlaced] Fetched orderType from contract and set OpenLimitOrder type {}",
    [OPEN_LIMIT_ORDER_TYPE_IX[cType]]
  );

  // construct Trade
  const tradeId = generateTradeId(event.transaction, event.logIndex, {
    trader,
    pairIndex,
    index,
  });
  const trade = updateTradeFromOpenLimitOrderContractObject(
    createOrLoadTrade(tradeId, event.block),
    cOpenLimitOrder,
    false
  );
  trade.trader = trader.toHexString();
  trade.type = TRADE_TYPE.LIMIT_ORDER_TRADE;
  trade.status = TRADE_STATUS.LIMIT_ORDER_PENDING;
  log.info("[handleOpenLimitPlaced] Constructed Trade {}", [tradeId]);

  // reference one another
  trade.openLimitOrder = openLimitOrder.id;
  openLimitOrder.trade = trade.id;

  // read active state and update
  const openLimitOrderMapping = addOpenLimitOrder(
    { trader, pairIndex, index },
    openLimitOrder.id,
    false
  );

  // save
  openLimitOrder.save();
  trade.save();
  openLimitOrderMapping.save();
}
