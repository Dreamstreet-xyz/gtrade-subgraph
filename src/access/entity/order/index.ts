import { ethereum, BigInt } from "@graphprotocol/graph-ts";

/**
 * Generate a deterministic id for a given order event
 * @param tx
 * @param logIndex
 * @param id
 * @returns ID as a string
 */
export function generateOrderId(
  tx: ethereum.Transaction,
  logIndex: BigInt,
  id: BigInt
): string {
  return tx.hash.toHexString() + "-" + logIndex.toString() + id.toString();
}

export {
  createOrLoadNftOrder,
  updateNftOrderFromContractObject,
} from "./NftOrder";
export {
  createOrLoadOpenLimitOrder,
  updateOpenLimitOrderFromContractObject,
} from "./OpenLimitOrder";
export { createOrLoadMarketOrder } from "./MarketOrder";
export { createOrLoadSlUpdateOrder } from "./SlUpdateOrder";
