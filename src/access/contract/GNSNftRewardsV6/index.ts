import { Address, dataSource } from "@graphprotocol/graph-ts";
import { NETWORKS } from "constants/index";
import mumbai from "config/mumbai.json";
import polygon from "config/polygon.json";
import { GNSNftRewardsV6 } from "types/GNSTradingV6/GNSNftRewardsV6";

/**
 * Returns a bound GNSNftRewardsV6 instance to address based on network
 * @returns GNSNftRewardsV6
 */
export function getNftRewardsContract(): GNSNftRewardsV6 {
  const address =
    (dataSource.network() === NETWORKS.POLYGON &&
      polygon.gnsNftRewardsV6.address) ||
    mumbai.gnsNftRewardsV6.address;
  return GNSNftRewardsV6.bind(Address.fromString(address));
}
