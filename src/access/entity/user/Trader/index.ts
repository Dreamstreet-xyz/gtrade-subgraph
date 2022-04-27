import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { Trader } from "../../../../types/schema";

export function createOrLoadTrader(
  address: Address,
  block: ethereum.Block
): Trader {
  let trader = Trader.load(address.toHexString());
  if (!trader) {
    trader = new Trader(address.toHexString());
    trader.createdAtTimestamp = block.timestamp;
    trader.createdAtBlockNumber = block.number;
    trader.save();
    log.info("[createOrLoadTrader] Created new Trader {}", [
      address.toHexString(),
    ]);
  }

  return trader;
}
