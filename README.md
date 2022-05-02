NOTE: The Graph compiles to WASM. This is AssemblyScript, not TypeScript. Please review the [AssemblyScript documentation](https://www.assemblyscript.org/concepts.html).

Notable limitations: No JSON, deconstruction, closures, global importing.

Please show successful build output when submitting PRs.

# gTrade V6 Subgraph

Decentralized leverage trading platform from Gains Network

Subgraph constructs and tracks:

- Trades across states pre open, open, close
- Orders: open limit orders, nft orders, slupdateorders, market orders
- Beginnings of traders and NFT holders

Subgraph listens to the following events:

- GNSTradingV6
  - ChainlinkCallbackTimeout
  - MarketOrderInitiated
  - NftOrderInitiated
  - OpenLimitCanceled
  - OpenLimitPlaced
  - OpenLimitUpdated
  - SlUpdateInitiated
  - SlUpdated
  - TpUpdated
- GNSTradingCallbacksV6
  - LimitExecuted
  - MarketCloseCanceled
  - MarketExecuted
  - MarketOpenCanceled
  - SlCanceled
  - SlUpdated
- GNSTradingVaultV5
  - Sent
  - ToClaim

# Key Entities

Please refer to schemas for fields available.

**Rule of thumb**: anything stored or emitted from the blockchain is stored (there are some derived fields as well).

## **entity** Trade

Tracks a trade across its lifecycle, from pre-open to close.

### States

- `LIMIT_ORDER_PENDING` - limit order is requested
- `LIMIT_ORDER_CANCELED` - limit order is canceled before fulfillment
- `OPENING` - pricing information is requested for open of trade
- `OPEN` - trade is open
- `CANCELED` - trade is canceled
- `OPEN_TIMED_OUT` - trade is canceled because of price request timeout
- `CLOSING` - pricing information is requsted for close of trade
- `CLOSE_TIMED_OUT` - pricing request timed out for close of trade
- `CLOSED` - trade is closed

Derived trade information is stored as well, such as pnl, fees, percent profit, etc.

Schema: https://github.com/Dreamstreet-xyz/gtrade-subgraph/blob/main/schema/trade/Trade.gql

## _interface_ PriceOrder

Tracks a price order across its lifecycle, from requested to received.

### States:

- `REQUESTED` - price order is requested
- `TIMED_OUT` - price request timed out
- `RECEIVED` - price order is received

Three kinds of price orders(**these are all their own entities**):

### **entity** MarketOrder

Open or close requested by trader

Schema: https://github.com/Dreamstreet-xyz/gtrade-subgraph/blob/main/schema/order/price/MarketOrder.gql

### **entity** NftOrder

Open or close requested by nft holder

Schema: https://github.com/Dreamstreet-xyz/gtrade-subgraph/blob/main/schema/order/price/NftOrder.gql

### **entity** SlUpdateOrder

SL update requested by trader

Schema: https://github.com/Dreamstreet-xyz/gtrade-subgraph/blob/main/schema/order/price/SlUpdateOrder.gql

## OpenLimitOrder

Tracks an open limit order across its lifecycle, from opened to fulfilled

### States

- `OPEN` - limit order is open
- `CANCELED` - limit order is canceled before fulfillment
- `FULFILLING` - limit order is fulfilling (price request is in progress)
- `FULFILLED` - limit order is fulfilled

Schema: https://github.com/Dreamstreet-xyz/gtrade-subgraph/blob/main/schema/order/limitorder/OpenLimitOrder.gql

## NftHolder

Address of the NFT holder

Schema: https://github.com/Dreamstreet-xyz/gtrade-subgraph/blob/main/schema/user/NftHolder.gql

## Trader

Address of the trader

Schema: https://github.com/Dreamstreet-xyz/gtrade-subgraph/blob/main/schema/user/Trader.gql

# Subgraphs

Because gTrade is on Polygon, subgraphs are part of The Graph's Hosted Service offering.

**Polygon subgraph**: _Not deployed yet_

**Mumbai subgraph**: https://github.com/Dreamstreet-xyz/gtrade-subgraph

# Build

`yarn configure:<network>`

# Deploy

- Be sure you've created a subgraph and have your token available.
- Update subgraph details in `package.json`

`GRAPH_ACCESS_TOKEN=<token> yarn deploy:<network>`

# Example Use Cases

## Personal Trading History

The following query will provide you with the same details as My Trades history on gains.trade:

Replace `<lower-case-address>` with your address in lower case.

```
{
  trades(where: {trader: "<lower-case-address>", status: CLOSED}, orderBy: createdAtBlockNumber, orderDirection: asc) {
    createdAtTimestamp
    pairIndex
    createdAtBlockNumber
    trader {
      id
    }
    marketOrders(where: {type_in: [MARKET_CLOSE]}) {
      type
      price
      transactions
    }
    nftOrders(where: {type_in: [LIMIT_CLOSE]}) {
      type
      price
      transactions
    }
    closePrice
    buy
    positionSizeDai
    leverage
    pnl
  }
}
```

## Open trades (24h)

The following query will provide the same details as All Trades (24h) on gains.trade:

Replace `<block_24h_ago>` with the block 24hrs ago.

```
{
  trades(where:{createdAtBlockNumber_gte: <block_24h_ago>, status:CLOSED}, orderBy: createdAtBlockNumber, orderDirection: asc){
    createdAtTimestamp
    createdAtBlockNumber
    pairIndex
    trader{
      id
    }
    type
    openPrice
    closePrice
    leverage
    positionSizeDai
    pnl
  }
}
```

## Tried opening a trade, where is it?

When opening a trade there are number of issues that might cause you to lose track of it. The following query will help troubleshoot the state:

Replace `<lower-case-address>` with your address in lower case, and `pair-index` with the your pair index just opened.

```
{
  trader(id:"<lower-case-address>"){
    trades(where:{status_not_in:[CLOSED], pairIndex: <pair-index>}){
      createdAtTimestamp
      status
      positionSizeDai
      marketOrders{
        type
        status
        transactions
      }
      nftOrders{
        type
        status
        transactions
      }
    }
  }
}
```

From this, you can see what the status is and corresponding states of orders + transactions to further the troubleshooting.

## All of your open trades

The following query will provide the same details as Your Open Trades on gains.trade:

Replace `lower-case-address` with your address in lower case.

```
{
  trader(id:"<lower-case-address>"){
    trades(where:{status:OPEN}){
      pairIndex
      index
      positionSizeDai
      leverage
      openPrice
      openFeeDai
      buy
      sl
      tp
    }
  }
}
```

## Others

- See when your Open Limit Order was triggered, down to the transaction
- See what NFT holder triggered your liquidation
- Confirm you updated your SL
- See close price of your trade
- etc...
