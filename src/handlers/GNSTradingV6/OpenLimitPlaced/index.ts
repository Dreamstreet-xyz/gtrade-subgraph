import { ethereum, log } from "@graphprotocol/graph-ts";
import {
  getTradesState,
  generateOrderId,
  generateTradeId,
  generateIdFromRawTradeTuple,
  updateOpenLimitOrderFromContractObject,
  updateTradeFromOpenLimitOrderContractObject,
  addOpenLimitOrder,
} from "access/entity";
import { getStorageContract } from "access/contract";
import { TRADE_STATUS, TRADE_TYPE } from "constants/index";
import { OpenLimitPlaced } from "types/GNSTradingV6/GNSTradingV6";
import { OpenLimitOrder, Trade } from "types/schema";

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
  const { trader, pairIndex, index } = event.params;

  // read storage contract state for trade details
  const storage = getStorageContract();

  // get open limit order id
  // id is only locally unique to currently open limit orders
  const cOpenLimitOrderId = storage.openLimitOrderIds(trader, pairIndex, index);

  // get open limit order
  const cOpenLimitOrder = storage.openLimitOrders(cOpenLimitOrderId);

  // construct OpenLimitOrder
  const openLimitOrderId = generateOrderId(
    event.transaction,
    event.logIndex,
    cOpenLimitOrderId
  );
  const openLimitOrder = updateOpenLimitOrderFromContractObject(
    new OpenLimitOrder(openLimitOrderId),
    cOpenLimitOrder,
    false
  );

  // TODO: update this to use contract value rather than tx input
  const txInput = ethereum.decode(
    "((address, uint256, uint256, uint256, uint256, uint256, bool, uint256, uint256, uint256),tuple, uint8, uint256, uint256, address)",
    event.transaction.input
  );
  openLimitOrder.type = txInput?.data.value10; // TODO: does this work?

  // construct Trade
  const tradeId = generateTradeId(event.transaction, event.logIndex, {
    trader,
    pairIndex,
    index,
  });
  const trade = updateTradeFromOpenLimitOrderContractObject(
    new Trade(tradeId),
    cOpenLimitOrder,
    false
  );
  trade.trader = trader.toHexString();
  trade.type = TRADE_TYPE.LIMIT_ORDER_TRADE;
  trade.status = TRADE_STATUS.LIMIT_ORDER_PENDING;

  // reference one another
  trade.openLimitOrder = openLimitOrder.id;
  openLimitOrder.trade = trade.id;

  // read active state and update
  const tradesState = addOpenLimitOrder(
    getTradesState(),
    { trader, pairIndex, index },
    openLimitOrder.id,
    false
  );

  // save
  openLimitOrder.save();
  trade.save();
  tradesState.save();
}
