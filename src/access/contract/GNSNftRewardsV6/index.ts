import { Address, dataSource } from "@graphprotocol/graph-ts";
import { NETWORKS, MUMBAI, POLYGON } from "../../../helpers/constants";
import { GNSNftRewardsV6 } from "../../../types/GNSTradingV6/GNSNftRewardsV6";

/**
 * Returns a bound GNSNftRewardsV6 instance to address based on network
 * @returns GNSNftRewardsV6
 */
export function getNftRewardsContract(): GNSNftRewardsV6 {
  const address =
    dataSource.network() == NETWORKS.POLYGON
      ? POLYGON.gnsNftRewardsV6
      : MUMBAI.gnsNftRewardsV6;
  return GNSNftRewardsV6.bind(Address.fromString(address));
}
