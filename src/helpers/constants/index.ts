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

class TradeStatus {
  OPENING: string;
  LIMIT_ORDER_PENDING: string;
  OPEN: string;
  CANCELED: string;
  OPEN_TIMED_OUT: string;
  CLOSING: string;
  CLOSE_TIMED_OUT: string;
  CLOSED: string;
}

export const TRADE_STATUS: TradeStatus = {
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

class TradeType {
  MARKET_TRADE: string;
  LIMIT_ORDER_TRADE: string;
}

export const TRADE_TYPE: TradeType = {
  MARKET_TRADE,
  LIMIT_ORDER_TRADE,
};

export const NONE = "NONE";
export const REQUESTED = "REQUESTED";
export const TIMED_OUT = "TIMED_OUT";
export const RECEIVED = "RECEIVED";

class PriceOrderStatus {
  NONE: string;
  REQUESTED: string;
  TIMED_OUT: string;
  RECEIVED: string;
}

export const PRICE_ORDER_STATUS: PriceOrderStatus = {
  NONE,
  REQUESTED,
  TIMED_OUT,
  RECEIVED,
};

class Networks {
  POLYGON: string;
  MUMBAI: string;
}

export const NETWORKS: Networks = {
  POLYGON: "polygon",
  MUMBAI: "mumbai",
};

class LimitOrderType {
  TP: string;
  SL: string;
  LIQ: string;
  OPEN: string;
}

export const LIMIT_ORDER_TYPE: LimitOrderType = {
  TP: "TP",
  SL: "SL",
  LIQ: "LIQ",
  OPEN: "OPEN",
};

export const LIMIT_ORDER_TYPE_IX = [
  LIMIT_ORDER_TYPE.TP,
  LIMIT_ORDER_TYPE.SL,
  LIMIT_ORDER_TYPE.LIQ,
  LIMIT_ORDER_TYPE.OPEN,
];

class OpenLimitOrderStatus {
  OPEN: string;
  CANCELED: string;
  FULFILLED: string;
}

export const OPEN_LIMIT_ORDER_STATUS: OpenLimitOrderStatus = {
  OPEN: "OPEN",
  CANCELED: "CANCELED",
  FULFILLED: "FULFILLED",
};

class PriceOrderType {
  MARKET_OPEN: string;
  MARKET_CLOSE: string;
  LIMIT_OPEN: string;
  LIMIT_CLOSE: string;
  UPDATE_SL: string;
}

export const PRICE_ORDER_TYPE: PriceOrderType = {
  MARKET_OPEN: "MARKET_OPEN",
  MARKET_CLOSE: "MARKET_CLOSE",
  LIMIT_OPEN: "LIMIT_OPEN",
  LIMIT_CLOSE: "LIMIT_CLOSE",
  UPDATE_SL: "UPDATE_SL",
};

export const PRICE_ORDER_TYPE_IX = [
  PRICE_ORDER_TYPE.MARKET_OPEN,
  PRICE_ORDER_TYPE.MARKET_CLOSE,
  PRICE_ORDER_TYPE.LIMIT_OPEN,
  PRICE_ORDER_TYPE.LIMIT_CLOSE,
  PRICE_ORDER_TYPE.UPDATE_SL,
];

class OpenLimitOrderType {
  LEGACY: string;
  REVERSAL: string;
  MOMENTUM: string;
}

export const OPEN_LIMIT_ORDER_TYPE: OpenLimitOrderType = {
  LEGACY: "LEGACY",
  REVERSAL: "REVERSAL",
  MOMENTUM: "MOMENTUM",
};

export const OPEN_LIMIT_ORDER_TYPE_IX = [
  OPEN_LIMIT_ORDER_TYPE.LEGACY,
  OPEN_LIMIT_ORDER_TYPE.REVERSAL,
  OPEN_LIMIT_ORDER_TYPE.MOMENTUM,
];

// duplicates of ../config

class NetworkAddresses {
  gnsTradingV6: string;
  gnsTradingCallbacksV6: string;
  gfarmTradingStorageV5: string;
  gnsPriceAggregatorV6: string;
  gnsNftRewardsV6: string;
}

export const MUMBAI: NetworkAddresses = {
  gnsTradingV6: "0x49370DC7319d8439C895015cBAD8E35D381e7d73",

  gnsTradingCallbacksV6: "0xbd124b3dae1fadeb421db545ddcb4c2146d60627",

  gfarmTradingStorageV5: "0x4d2df485c608aa55a23d8d98dd2b4fa24ba0f2cf",

  gnsPriceAggregatorV6: "0x5f105e929789fcae415cb03ea28d1f60c6091d6d",

  gnsNftRewardsV6: "0x3982e3de77dad60373c0c2c539fcb93bd288d2f5",
};

export const POLYGON: NetworkAddresses = {
  gnsTradingV6: "0x49370DC7319d8439C895015cBAD8E35D381e7d73",

  gnsTradingCallbacksV6: "0x3087aC91A2D49f84D795d6c2Ce324845360f57c8",

  gfarmTradingStorageV5: "0x4d2df485c608aa55a23d8d98dd2b4fa24ba0f2cf",

  gnsPriceAggregatorV6: "0x16E4F4956f39dd37E170C9f7A4AFeCD4025F272a",

  gnsNftRewardsV6: "0x3470756E5B490a974Bc25FeEeEb24c11102f5268",
};
