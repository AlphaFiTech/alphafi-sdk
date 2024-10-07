export const investors = `query GetInvestors {
  alphaSuiInvestor: object(address: "0x46d901d5e1dba34103038bd2ba789b775861ea0bf4d6566afd5029cf466a3d88") {
    ...InvestorFields
  }
  usdcUsdtInvestor: object(address: "0x87a76889bf4ed211276b16eb482bf6df8d4e27749ebecd13017d19a63f75a6d5") {
    ...InvestorFields
  }
  usdyUsdcInvestor: object(address: "0x1b923520f19660d4eb013242c6d03c84fdea034b8f784cfd71173ef72ece50e1") {
    ...InvestorFields
  }
  suiUsdcInvestor: object(address: "0xb6ca8aba0fb26ed264a3ae3d9c1461ac7c96cdcbeabb01e71086e9a8340b9c55") {
    ...InvestorFields
  }
  wethUsdcInvestor: object(address: "0x05fa099d1df7b5bfb2e420d5ee2d63508db17c40ce7c4e0ca0305cd5df974e43") {
    ...InvestorFields
  }
  wbtcUsdcInvestor: object(address: "0x9ae0e56aa0ebc27f9d8a17b5a9118d368ba262118d878977b6194a10a671bbbc") {
    ...InvestorFields
  }
  navxSuiInvestor: object(address: "0xdd9018247d579bd7adfdbced4ed39c28821c6019461d37dbdf32f0d409959b1c") {
    ...InvestorFields
  }
}

fragment InvestorFields on Object {
  asMoveObject {
    contents {
      type {
        repr
      }
      json
    }
  }
}
`;
