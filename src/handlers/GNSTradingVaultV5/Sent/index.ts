import { log } from "@graphprotocol/graph-ts";
import { addSentLookup } from "../../../access/entity";
import { Sent } from "../../../types/GNSTradingVaultV5/GNSTradingVaultV5";

/**
 * Event is emitted when a trade is closed and the vault sends the trader DAI.
 *
 * Events of the same block are handled in canonical order of the order they were emitted
 * in each transaction. This event is emitted in the same tx as market and limit exection, and before.
 * So, the handler will set a ContractIdMapping entity for lookup.
 *
 * Basic flow:
 * a. set ContractIdMapping object for execution event to receive
 *
 * @param event Sent
 */
export function handleSent(event: Sent): void {
  const trader = event.params.trader;
  const amount = event.params.amount;
  log.info("[handleSent] Address: {}, Amount: {}", [
    trader.toHexString(),
    amount.toString(),
  ]);

  // create object for execution event to lookup in the same tx
  addSentLookup(event.transaction, trader, amount, true);
}
