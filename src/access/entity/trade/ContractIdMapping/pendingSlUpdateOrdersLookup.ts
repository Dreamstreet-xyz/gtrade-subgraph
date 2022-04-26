import { ContractIdMapping } from "../../../../types/schema";
import {
  getEntityIdFromContractId,
  addContractIdMappingWithId,
  removeContractIdMapping,
} from "./index";

const SLU_PREFIX = "slu-";

export function getPendingSlUpdateOrderId(orderId: string): string {
  const id = `${SLU_PREFIX}${orderId}`;
  return getEntityIdFromContractId(id);
}

export function addPendingSlUpdateOrder(
  orderId: string,
  slUpdateOrderId: string,
  save: boolean
): ContractIdMapping {
  const id = `${SLU_PREFIX}${orderId}`;
  return addContractIdMappingWithId(id, slUpdateOrderId, save);
}

export function removePendingSlUpdateOrder(orderId: string): void {
  const id = `${SLU_PREFIX}${orderId}`;
  removeContractIdMapping(id);
}
