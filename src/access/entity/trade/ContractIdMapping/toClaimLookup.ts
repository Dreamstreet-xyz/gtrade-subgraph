import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  addContractIdMappingWithId,
  getEntityIdFromContractId,
  removeContractIdMapping,
} from ".";
import { ContractIdMapping } from "../../../../types/schema";

const TO_CLAIM_PREFIX = "toClaim-";

export function getToClaimAmount(
  transaction: ethereum.Transaction,
  trader: Address
): string {
  const id = `${TO_CLAIM_PREFIX}${transaction.hash.toHexString()}-${trader.toHexString()}`;
  return getEntityIdFromContractId(id);
}

export function addToClaimLookup(
  transaction: ethereum.Transaction,
  trader: Address,
  amount: BigInt,
  save: boolean
): ContractIdMapping {
  const id = `${TO_CLAIM_PREFIX}${transaction.hash.toHexString()}-${trader.toHexString()}`;
  return addContractIdMappingWithId(id, amount.toString(), save);
}

export function removeToClaimLookup(
  transaction: ethereum.Transaction,
  trader: Address
): void {
  const id = `${TO_CLAIM_PREFIX}${transaction.hash.toHexString()}-${trader.toHexString()}`;
  removeContractIdMapping(id);
}
