import { ethereum, BigInt, crypto, ByteArray } from "@graphprotocol/graph-ts";

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
  return crypto
    .keccak256(
      ByteArray.fromUTF8(
        tx.hash.toHexString() + "-" + logIndex.toString() + id.toString()
      )
    )
    .toHexString();
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
