import { Address, dataSource } from "@graphprotocol/graph-ts";
import { NETWORKS, MUMBAI, POLYGON } from "../../../helpers/constants";
import { GNSPriceAggregatorV6 } from "../../../types/GNSTradingV6/GNSPriceAggregatorV6";

/**
 * Returns a bound GNSPriceAggregatorV6 instance to address based on network
 * @returns GNSPriceAggregatorV6
 */
export function getPriceAggregatorContract(): GNSPriceAggregatorV6 {
  const address =
    dataSource.network() === NETWORKS.POLYGON
      ? POLYGON.gnsPriceAggregatorV6
      : MUMBAI.gnsPriceAggregatorV6;
  return GNSPriceAggregatorV6.bind(Address.fromString(address));
}
