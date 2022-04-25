import { dataSource, log, json } from "@graphprotocol/graph-ts";
import { NETWORKS, MUMBAI, POLYGON } from "../../../../helpers/constants";
import { ContractTradeState } from "../../../../types/schema";

/**
 * Returns a bound GFarmTradingStorageV5 instance to address based on network
 * @returns GFarmTradingStorageV5
 */
export function getTradesState(): ContractTradeState {
  const address =
    (dataSource.network() === NETWORKS.POLYGON &&
      POLYGON.gfarmTradingStorageV5) ||
    MUMBAI.gfarmTradingStorageV5;
  let state = ContractTradeState.load(address);
  if (!state) {
    log.info(
      "[getTradesState] No trades state found for contract {}, initializing",
      [address]
    );
    state = new ContractTradeState(address);
    state._openLimitOrdersLookup = JSON.stringify({});
    state._openTradesLookup = JSON.stringify({});
    state._openTradesInfoLookup = JSON.stringify({});
    state._pendingMarketOrdersLookup = JSON.stringify({});
    state._pendingNftOrdersLookup = JSON.stringify({});
    state._pendingSlUpdateOrdersLookup = JSON.stringify({});
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

export {
  getPendingSlUpdateOrderId,
  addPendingSlUpdateOrder,
  removePendingSlUpdateOrder,
} from "./pendingSlUpdateOrdersLookup";
