import { Address, dataSource } from "@graphprotocol/graph-ts";
import { GFarmTradingStorageV5 } from "../../../types/GNSTradingV6/GFarmTradingStorageV5";
import { NETWORKS, MUMBAI, POLYGON } from "../../../helpers/constants";

/**
 * Returns a bound GFarmTradingStorageV5 instance to address based on network
 * @returns GFarmTradingStorageV5
 */
export function getStorageContract(): GFarmTradingStorageV5 {
  const address =
    dataSource.network() == NETWORKS.POLYGON
      ? POLYGON.gfarmTradingStorageV5
      : MUMBAI.gfarmTradingStorageV5;
  return GFarmTradingStorageV5.bind(Address.fromString(address));
}
