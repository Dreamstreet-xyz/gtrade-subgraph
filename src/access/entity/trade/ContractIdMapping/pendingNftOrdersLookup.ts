import { ContractIdMapping } from "../../../../types/schema";
import {
  getEntityIdFromContractId,
  addContractIdMappingWithId,
  removeContractIdMapping,
} from "./index";

const PNFTO_PREFIX = "pnfto-";

export function getPendingNftOrderId(orderId: string): string {
  const id = `${PNFTO_PREFIX}${orderId}`;
  return getEntityIdFromContractId(id);
}

export function addPendingNftOrder(
  orderId: string,
  nftOrderId: string,
  save: boolean
): ContractIdMapping {
  const id = `${PNFTO_PREFIX}${orderId}`;
  return addContractIdMappingWithId(id, nftOrderId, save);
}

export function removePendingNftOrder(orderId: string): void {
  const id = `${PNFTO_PREFIX}${orderId}`;
  removeContractIdMapping(id);
}
