import { log, store } from "@graphprotocol/graph-ts";
import { ContractIdMapping } from "../../../../types/schema";

export function getEntityIdFromContractId(id: string): string {
  log.debug("[getEntityIdFromContractId] {}", [id]);
  const cOlo = ContractIdMapping.load(id);
  if (cOlo) {
    return cOlo.entityId;
  }

  return "";
}

export function addContractIdMappingWithId(
  id: string,
  entityId: string,
  save: boolean
): ContractIdMapping {
  log.debug("[addContractIdMappingWithId] {}, {}, {}", [
    id,
    entityId,
    save ? "true" : "false",
  ]);
  let contractIdMapping = ContractIdMapping.load(id);
  if (!contractIdMapping) {
    contractIdMapping = new ContractIdMapping(id);
  }
  contractIdMapping.entityId = entityId;

  if (save) {
    contractIdMapping.save();
  }

  return contractIdMapping;
}

export function removeContractIdMapping(id: string): void {
  log.debug("[removeContractIdMapping] {}", [id]);
  store.remove("ContractIdMapping", id);
}

export {
  getPendingMarketOrderId,
  addPendingMarketOrder,
  removePendingMarketOrder,
} from "./pendingMarketOrdersLookup";
export {
  getOpenTradeId,
  addOpenTrade,
  removeOpenTrade,
} from "./openTradesLookup";
export {
  getOpenTradeInfoId,
  addOpenTradeInfo,
  removeOpenTradeInfo,
} from "./openTradesInfoLookup";
export {
  getOpenLimitOrderId,
  addOpenLimitOrder,
  removeOpenLimitOrder,
} from "./openLimitOrdersLookup";
export {
  getPendingNftOrderId,
  addPendingNftOrder,
  removePendingNftOrder,
} from "./pendingNftOrdersLookup";

export {
  getPendingSlUpdateOrderId,
  addPendingSlUpdateOrder,
  removePendingSlUpdateOrder,
} from "./pendingSlUpdateOrdersLookup";

export { getSentAmount, addSentLookup, removeSentLookup } from "./sentLookup";

export {
  getToClaimAmount,
  addToClaimLookup,
  removeToClaimLookup,
} from "./toClaimLookup";
