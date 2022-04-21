import { Address } from "@graphprotocol/graph-ts";
import { NftHolder } from "types/schema";

export function getNftHolderOrCreate(address: Address): NftHolder {
  return (
    NftHolder.load(address.toHexString()) ||
    new NftHolder(address.toHexString())
  );
}

export function createNftHolderIfDne(address: Address): void {
  const existing = NftHolder.load(address.toHexString());
  if (!existing) {
    const newNftHolder = new NftHolder(address.toHexString());
    newNftHolder.save();
  }
}
