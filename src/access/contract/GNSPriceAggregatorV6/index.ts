import { Address, dataSource } from "@graphprotocol/graph-ts";
import { NETWORKS } from "constants/index";
import mumbai from "config/mumbai.json";
import polygon from "config/polygon.json";
import { GNSPriceAggregatorV6 } from "types/GNSTradingV6/GNSPriceAggregatorV6";

/**
 * Returns a bound GNSPriceAggregatorV6 instance to address based on network
 * @returns GNSPriceAggregatorV6
 */
export function getPriceAggregatorContract(): GNSPriceAggregatorV6 {
  const address =
    (dataSource.network() === NETWORKS.POLYGON &&
      polygon.gnsPriceAggregatorV6.address) ||
    mumbai.gnsPriceAggregatorV6.address;
  return GNSPriceAggregatorV6.bind(Address.fromString(address));
}
