import { ContractIdMapping } from "../../../../types/schema";
import {
  getEntityIdFromContractId,
  addContractIdMappingWithId,
  removeContractIdMapping,
} from "./index";

const PMO_PREFIX = "pmo-";

export function getPendingMarketOrderId(orderId: string): string {
  const id = `${PMO_PREFIX}${orderId}`;
  return getEntityIdFromContractId(id);
}

export function addPendingMarketOrder(
  orderId: string,
  marketOrderId: string,
  save: boolean
): ContractIdMapping {
  const id = `${PMO_PREFIX}${orderId}`;
  return addContractIdMappingWithId(id, marketOrderId, save);
}

export function removePendingMarketOrder(orderId: string): void {
  const id = `${PMO_PREFIX}${orderId}`;
  removeContractIdMapping(id);
}
