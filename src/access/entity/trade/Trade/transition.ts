import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { TRADE_STATUS } from "../../../../helpers/constants";
import { Trade } from "../../../../types/schema";
import {
  getSentAmount,
  getToClaimAmount,
  removeSentLookup,
  removeToClaimLookup,
} from "../ContractIdMapping";

export function transitionTradeToOpen(
  trade: Trade,
  positionSizeDai: BigInt,
  openPrice: BigInt,
  save: boolean
): Trade {
  trade.status = TRADE_STATUS.OPEN;

  // calculate openFeeDai
  // positionSizeDai stored in Trade before officially opening is the preFee amount
  const initialPositionSizeDai = trade.positionSizeDai;
  trade.openFeeDai = initialPositionSizeDai.minus(positionSizeDai);
  trade.positionSizeDai = positionSizeDai;
  trade.openPrice = openPrice;

  if (save) {
    trade.save();
  }
  return trade;
}

export function transitionTradeToClose(
  trade: Trade,
  percentProfit: BigInt,
  closePrice: BigInt,
  transaction: ethereum.Transaction,
  save: boolean
): Trade {
  trade.status = TRADE_STATUS.CLOSED;
  trade.percentProfit = percentProfit;
  trade.closePrice = closePrice;

  const address = Address.fromBytes(Address.fromHexString(trade.trader));

  // lookup if trader received DAI or is owed
  let received = getSentAmount(transaction, address);

  if (!received) {
    received = getToClaimAmount(transaction, address);
    if (!received) {
      log.error(
        "[transitionTradeToClose] No sent or claim amount found for trader {}",
        [trade.trader]
      );
      return trade;
    }
    removeToClaimLookup(transaction, address);
  } else {
    removeSentLookup(transaction, address);
  }

  const receivedBigInt = BigInt.fromString(received);
  trade.pnl = receivedBigInt.minus(trade.positionSizeDai);
  if (percentProfit) {
    trade.closeFeeDai = trade.positionSizeDai.plus(
      trade.positionSizeDai
        .times(percentProfit)
        .div(BigInt.fromI64(i64(1e10)))
        .div(BigInt.fromI32(100))
        .minus(receivedBigInt)
    );
  }

  if (save) {
    trade.save();
  }

  return trade;
}
