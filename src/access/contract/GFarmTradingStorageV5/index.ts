import { Address, dataSource } from "@graphprotocol/graph-ts";
import { GFarmTradingStorageV5 } from "types/GNSTradingV6/GFarmTradingStorageV5";
import { NETWORKS } from "constants/index";
import mumbai from "config/mumbai.json";
import polygon from "config/polygon.json";

/**
 * Returns a bound GFarmTradingStorageV5 instance to address based on network
 * @returns GFarmTradingStorageV5
 */
export function getStorageContract(): GFarmTradingStorageV5 {
  const address =
    (dataSource.network() === NETWORKS.POLYGON &&
      polygon.gfarmTradingStorageV5.address) ||
    mumbai.gfarmTradingStorageV5.address;
  return GFarmTradingStorageV5.bind(Address.fromString(address));
}
