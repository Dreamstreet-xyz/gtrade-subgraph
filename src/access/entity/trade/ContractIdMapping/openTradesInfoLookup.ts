import { ContractIdMapping } from "../../../../types/schema";
import { generateIdFromTradeTuple, TradeTuple } from "../Trade";
import {
  getEntityIdFromContractId,
  addContractIdMappingWithId,
  removeContractIdMapping,
} from "./index";

const OTI_PREFIX = "oti-";

export function getOpenTradeInfoId(tradeTuple: TradeTuple): string {
  const id = `${OTI_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  return getEntityIdFromContractId(id);
}

export function addOpenTradeInfo(
  tradeTuple: TradeTuple,
  tradeInfoId: string,
  save: boolean
): ContractIdMapping {
  const id = `${OTI_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  return addContractIdMappingWithId(id, tradeInfoId, save);
}

export function removeOpenTradeInfo(tradeTuple: TradeTuple): void {
  const id = `${OTI_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  removeContractIdMapping(id);
}
