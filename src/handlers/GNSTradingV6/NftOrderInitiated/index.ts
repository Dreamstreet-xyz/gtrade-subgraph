import { log } from "@graphprotocol/graph-ts";
import { stringifyTuple } from "../../../access/entity/trade/Trade";
import { getStorageContract } from "../../../access/contract";
import { getPriceAggregatorContract } from "../../../access/contract/GNSPriceAggregatorV6";
import {
  generateOrderId,
  updateNftOrderFromContractObject,
  getOpenLimitOrderId,
  addPendingNftOrder,
  createOrLoadNftHolder,
  getOpenTradeId,
  createOrLoadNftOrder,
  createOrLoadOpenLimitOrder,
} from "../../../access/entity";
import {
  TRADE_STATUS,
  PRICE_ORDER_STATUS,
  LIMIT_ORDER_TYPE,
  LIMIT_ORDER_TYPE_IX,
  PRICE_ORDER_TYPE_IX,
  OPEN_LIMIT_ORDER_STATUS,
} from "../../../helpers/constants";
import { NftOrderInitiated } from "../../../types/GNSTradingV6/GNSTradingV6";
import { NftOrder, OpenLimitOrder, Trade } from "../../../types/schema";

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
  const nftHolder = event.params.nftHolder;
  const trader = event.params.trader;
  const pairIndex = event.params.pairIndex;
  const orderId = event.params.orderId;

  log.info(
    "[handleNftOrderInitiated] OrderId {}, Trader {}, PairIndex {}, NftHolder {}",
    [
      orderId.toString(),
      trader.toHexString(),
      pairIndex.toString(),
      nftHolder.toHexString(),
    ]
  );

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

  // create NftHolder if dne
  createOrLoadNftHolder(nftHolder, event.block);

  // fetch pending order and construct NftOrder
  const cPendingNftOrder = storage.reqID_pendingNftOrder(orderId);
  log.info(
    "[handleNftOrderInitiated] Fetched pendingNftOrder from contract",
    []
  );

  const nftOrder = updateNftOrderFromContractObject(
    createOrLoadNftOrder(
      generateOrderId(event.transaction, event.logIndex, orderId),
      event
    ),
    cPendingNftOrder,
    false
  );
  nftOrder.status = PRICE_ORDER_STATUS.REQUESTED;
  nftOrder.type = PRICE_ORDER_TYPE_IX[aggregator.orders(orderId).value1];
  log.info("[handleNftOrderInitiated] NftOrder created {}", [nftOrder.id]);

  const index = cPendingNftOrder.value4;
  const orderType = cPendingNftOrder.value5;

  let tradeId: string;
  log.info("[handleNftOrderInitiated] OrderType {}, {}", [
    orderType.toString(),
    LIMIT_ORDER_TYPE_IX[orderType],
  ]);
  if (LIMIT_ORDER_TYPE_IX[orderType] == LIMIT_ORDER_TYPE.OPEN) {
    // lookup OpenLimitOrder to get Trade obj for updating
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
    openLimitOrder.status = OPEN_LIMIT_ORDER_STATUS.FULFILLING;

    tradeId = openLimitOrder.trade;
    log.info("[handleNftOrderInitiated] OpenLimitOrder found {}", [
      openLimitOrderId,
    ]);
    openLimitOrder.save();
  } else {
    // lookup open trade to get Trade obj for updating
    tradeId = getOpenTradeId({ trader, pairIndex, index });
  }

  if (!tradeId) {
    log.error(
      "[handleNftOrderInitiated] Open trade ID not found for OrderId: {}, Tuple: {}",
      [orderId.toString(), stringifyTuple({ trader, pairIndex, index })]
    );
    return;
  }

  // update existing Trade obj
  const trade = Trade.load(tradeId);
  if (!trade) {
    log.error(
      "[handleNftOrderInitiated] Trade {} not found for orderId {} / {}",
      [orderId.toString(), stringifyTuple({ trader, pairIndex, index })]
    );
    return;
  }
  trade.status =
    LIMIT_ORDER_TYPE_IX[orderType] == LIMIT_ORDER_TYPE.OPEN
      ? TRADE_STATUS.OPENING
      : TRADE_STATUS.CLOSING;
  log.info("[handleNftOrderInitiated] Trade updated {}", [tradeId]);

  // associate
  nftOrder.trade = tradeId;

  // update state
  addPendingNftOrder(orderId.toString(), nftOrder.id, true);

  // save
  nftOrder.save();
  trade.save();
}
