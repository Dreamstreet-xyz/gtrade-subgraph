import { Address } from "@graphprotocol/graph-ts";
import { Trader } from "../../../../types/schema";

export function getTraderOrCreate(address: Address): Trader {
  return (
    Trader.load(address.toHexString()) || new Trader(address.toHexString())
  );
}

export function createTraderIfDne(address: Address): void {
  const existing = Trader.load(address.toHexString());
  if (!existing) {
    const newTrader = new Trader(address.toHexString());
    newTrader.save();
  }
}
