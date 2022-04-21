import { dataSource, log } from "@graphprotocol/graph-ts";
import { NETWORKS } from "constants/index";
import mumbai from "config/mumbai.json";
import polygon from "config/polygon.json";
import { ContractTradeState } from "types/schema";

/**
 * Returns a bound GFarmTradingStorageV5 instance to address based on network
 * @returns GFarmTradingStorageV5
 */
export function getTradesState(): ContractTradeState {
  const address =
    (dataSource.network() === NETWORKS.POLYGON &&
      polygon.gfarmTradingStorageV5.address) ||
    mumbai.gfarmTradingStorageV5.address;
  let state = ContractTradeState.load(address);
  if (!state) {
    log.info(
      "[getTradesState] No trades state found for contract {}, initializing",
      [address]
    );
    state = new ContractTradeState(address);
    state._openTradesLookup = JSON.stringify({});
    state._openLimitOrdersLookup = JSON.stringify({});
    state._pendingMarketOrdersLookup = JSON.stringify({});
    state._openTradesInfoLookup = JSON.stringify({});
    state.save();
  }

  return state;
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
