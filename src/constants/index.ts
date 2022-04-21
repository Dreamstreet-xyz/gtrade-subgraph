import { BigInt } from "@graphprotocol/graph-ts";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);

export const LIMIT_ORDER_PENDING = "LIMIT_ORDER_PENDING";
export const OPENING = "OPENING";
export const OPEN = "OPEN";
export const CANCELED = "CANCELED";
export const OPEN_TIMED_OUT = "OPEN_TIMED_OUT";
export const CLOSING = "CLOSING";
export const CLOSE_TIMED_OUT = "CLOSE_TIMED_OUT";
export const CLOSED = "CLOSED";

export const TRADE_STATUS = {
  OPENING,
  LIMIT_ORDER_PENDING,
  OPEN,
  CANCELED,
  OPEN_TIMED_OUT,
  CLOSING,
  CLOSE_TIMED_OUT,
  CLOSED,
};

export const TERMINAL_TRADE_STATES = [CANCELED, OPEN_TIMED_OUT, CLOSED];

export const MARKET_TRADE = "MARKET";
export const LIMIT_ORDER_TRADE = "LIMIT_ORDER";

export const TRADE_TYPE = {
  MARKET_TRADE,
  LIMIT_ORDER_TRADE,
};

export const NONE = "NONE";
export const REQUESTED = "REQUESTED";
export const RECEIVED = "RECEIVED";

export const PRICE_ORDER_STATUS = {
  NONE,
  REQUESTED,
  RECEIVED,
};

export const NETWORKS = {
  POLYGON: "polygon",
  MUMBAI: "mumbai",
};

export const LIMIT_ORDER = {
  TP: "TP",
  SL: "SL",
  LIQ: "LIQ",
  OPEN: "OPEN",
};

export const LIMIT_ORDER_IX = [
  LIMIT_ORDER.TP,
  LIMIT_ORDER.SL,
  LIMIT_ORDER.LIQ,
  LIMIT_ORDER.OPEN,
];
