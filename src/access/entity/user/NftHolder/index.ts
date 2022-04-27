import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { NftHolder } from "../../../../types/schema";

export function createOrLoadNftHolder(
  address: Address,
  block: ethereum.Block
): NftHolder {
  let holder = NftHolder.load(address.toHexString());
  if (!holder) {
    holder = new NftHolder(address.toHexString());
    holder.createdAtTimestamp = block.timestamp;
    holder.createdAtBlockNumber = block.number;
    holder.save();
    log.info("[createOrLoadNftHolder] Created new NftHolder {}", [
      address.toHexString(),
    ]);
  }

  return holder;
}
