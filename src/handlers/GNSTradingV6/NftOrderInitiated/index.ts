import { ethereum, log } from "@graphprotocol/graph-ts";
import { getStorageContract } from "access/contract";
import { getPriceAggregatorContract } from "access/contract/GNSPriceAggregatorV6";
import {
  generateOrderId,
  getTradesState,
  updateNftOrderFromContractObject,
  getOpenLimitOrderId,
  addPendingNftOrder,
  createNftHolderIfDne,
  getOpenTradeId,
} from "access/entity";
import {
  TRADE_STATUS,
  PRICE_ORDER_STATUS,
  LIMIT_ORDER_TYPE,
  LIMIT_ORDER_TYPE_IX,
  PRICE_ORDER_TYPE_IX,
} from "constants/index";
import { NftOrderInitiated } from "types/GNSTradingV6/GNSTradingV6";
import { NftOrder, OpenLimitOrder, Trade } from "types/schema";

/**
 * Event is emitted when a Limit Order is initiated. This can be during opening of a trade (in the case of an open limit order)
 * or closing (in the case of liquidation, stop loss, limit order), and this handler deals with both cases.
 *
 * Basic flow:
 * a. create new NftOrder obj
 * b. update Trade obj to opening or closing status
 * c. associate NftOrder with Trade obj
 * d. update contract state
 *
 * @param event OpenLimitPlaced event
 */
export function handleNftOrderInitiated(event: NftOrderInitiated): void {
  const { nftHolder, trader, pairIndex, orderId } = event.params;
  //   const txInput = ethereum.decode(
  //     "(uint8, address, uint256, uint256, uint256, uint256)",
  //     event.transaction.input
  //   );
  //     const [_orderType, _pairIndex, _index, _nftId, _nftType] = [
  //       txInput?.data.value0,
  //       txInput?.data.value1,
  //       txInput?.data.value2,
  //       txInput?.data.value3,
  //       txInput?.data.value4,
  //     ];

  const storage = getStorageContract();
  const aggregator = getPriceAggregatorContract();
  let state = getTradesState();

  // create NftHolder if dne
  createNftHolderIfDne(nftHolder);

  // fetch pending order and construct NftOrder
  const cPendingNftOrder = storage.reqID_pendingNftOrder(orderId);
  const nftOrder = updateNftOrderFromContractObject(
    new NftOrder(generateOrderId(event.transaction, event.logIndex, orderId)),
    cPendingNftOrder,
    false
  );
  nftOrder.status = PRICE_ORDER_STATUS.REQUESTED;
  nftOrder.type = PRICE_ORDER_TYPE_IX[aggregator.orders(orderId).value1];

  const index = cPendingNftOrder.value4;
  const orderType = cPendingNftOrder.value5;

  let tradeId;
  if (LIMIT_ORDER_TYPE_IX[orderType] === LIMIT_ORDER_TYPE.OPEN) {
    // lookup OpenLimitOrder to get Trade obj for updating
    const openLimitOrderId = getOpenLimitOrderId(state, {
      trader,
      pairIndex,
      index,
    });
    const openLimitOrder = OpenLimitOrder.load(openLimitOrderId);
    if (!openLimitOrder) {
      log.error(
        "[handleNftOrderInitiated] OpenLimitOrder not found for openLimitOrderId {} / {}",
        [openLimitOrderId, JSON.stringify({ trader, pairIndex, index })]
      );
      return;
    }
    tradeId = openLimitOrder.trade;
  } else {
    // lookup open trade to get Trade obj for updating
    tradeId = getOpenTradeId(state, { trader, pairIndex, index });
  }

  if (!tradeId) {
    log.error(
      "[handleNftOrderInitiated] tradeId not found for orderId {} / {}",
      [orderId.toHexString(), JSON.stringify({ trader, pairIndex, index })]
    );
    return;
  }

  // update existing Trade obj
  const trade = Trade.load(tradeId);
  if (!trade) {
    log.error(
      "[handleNftOrderInitiated] Trade {} not found for orderId {} / {}",
      [orderId.toHexString(), JSON.stringify({ trader, pairIndex, index })]
    );
    return;
  }
  trade.status =
    LIMIT_ORDER_TYPE_IX[orderType] === LIMIT_ORDER_TYPE.OPEN
      ? TRADE_STATUS.OPENING
      : TRADE_STATUS.CLOSING;

  // associate
  nftOrder.trade = tradeId;

  // update state
  state = addPendingNftOrder(state, orderId.toHexString(), nftOrder.id, false);

  // save
  nftOrder.save();
  trade.save();
  state.save();
}
