import { ContractIdMapping } from "../../../../types/schema";
import { generateIdFromTradeTuple, TradeTuple } from "../Trade";
import {
  getEntityIdFromContractId,
  addContractIdMappingWithId,
  removeContractIdMapping,
} from "./index";

const OT_PREFIX = "ot-";

export function getOpenTradeId(tradeTuple: TradeTuple): string {
  const id = `${OT_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  return getEntityIdFromContractId(id);
}

export function addOpenTrade(
  tradeTuple: TradeTuple,
  TradeId: string,
  save: boolean
): ContractIdMapping {
  const id = `${OT_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  return addContractIdMappingWithId(id, TradeId, save);
}

export function removeOpenTrade(tradeTuple: TradeTuple): void {
  const id = `${OT_PREFIX}${generateIdFromTradeTuple(tradeTuple)}`;
  removeContractIdMapping(id);
}
