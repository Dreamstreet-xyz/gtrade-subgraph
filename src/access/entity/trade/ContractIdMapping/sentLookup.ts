import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  addContractIdMappingWithId,
  getEntityIdFromContractId,
  removeContractIdMapping,
} from ".";
import { ContractIdMapping } from "../../../../types/schema";

const SENT_PREFIX = "sent-";

export function getSentAmount(
  transaction: ethereum.Transaction,
  trader: Address
): string {
  const id = `${SENT_PREFIX}${transaction.hash.toHexString()}-${trader.toHexString()}`;
  return getEntityIdFromContractId(id);
}

export function addSentLookup(
  transaction: ethereum.Transaction,
  trader: Address,
  amount: BigInt,
  save: boolean
): ContractIdMapping {
  const id = `${SENT_PREFIX}${transaction.hash.toHexString()}-${trader.toHexString()}`;
  return addContractIdMappingWithId(id, amount.toString(), save);
}

export function removeSentLookup(
  transaction: ethereum.Transaction,
  trader: Address
): void {
  const id = `${SENT_PREFIX}${transaction.hash.toHexString()}-${trader.toHexString()}`;
  removeContractIdMapping(id);
}
