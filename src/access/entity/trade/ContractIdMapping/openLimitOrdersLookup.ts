import { ContractIdMapping } from "../../../../types/schema";
import { generateIdFromTradeTuple, TradeTuple } from "../Trade";
import {
  getEntityIdFromContractId,
  addContractIdMappingWithId,
  removeContractIdMapping,
} from "./index";

const OLO_PREFIX = "olo-";

export function getOpenLimitOrderId(tradeTuple: TradeTuple): string {
  const id = `${OLO_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  return getEntityIdFromContractId(id);
}

export function addOpenLimitOrder(
  tradeTuple: TradeTuple,
  openLimitOrderId: string,
  save: boolean
): ContractIdMapping {
  const id = `${OLO_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  return addContractIdMappingWithId(id, openLimitOrderId, save);
}

export function removeOpenLimitOrder(tradeTuple: TradeTuple): void {
  const id = `${OLO_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  removeContractIdMapping(id);
}
