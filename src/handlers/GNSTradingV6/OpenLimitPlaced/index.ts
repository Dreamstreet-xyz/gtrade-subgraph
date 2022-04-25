import { ethereum, log } from "@graphprotocol/graph-ts";
import {
  getTradesState,
  generateOrderId,
  generateTradeId,
  generateIdFromRawTradeTuple,
  updateOpenLimitOrderFromContractObject,
  updateTradeFromOpenLimitOrderContractObject,
  addOpenLimitOrder,
  createTraderIfDne,
} from "../../../access/entity";
import { getStorageContract } from "../../../access/contract";
import {
  OPEN_LIMIT_ORDER_TYPE_IX,
  TRADE_STATUS,
  TRADE_TYPE,
} from "../../../helpers/constants";
import { OpenLimitPlaced } from "../../../types/GNSTradingV6/GNSTradingV6";
import { OpenLimitOrder, Trade } from "../../../types/schema";
import { getNftRewardsContract } from "../../../access/contract/GNSNftRewardsV6";

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

  createTraderIfDne(trader);

  // read storage contract state for trade details
  const storage = getStorageContract();

  // get open limit order id
  // id is only locally unique to currently open limit orders
  const cOpenLimitOrderId = storage.openLimitOrderIds(trader, pairIndex, index);

  // get open limit order
  const cOpenLimitOrder = storage.getOpenLimitOrder(trader, pairIndex, index);

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
