export const pools = `query GetPools {
  alphaPool: object(address: "0x6ee8f60226edf48772f81e5986994745dae249c2605a5b12de6602ef1b05b0c1") {
    ...PoolFields
  }
  alphaSuiPool: object(address: "0x594f13b8f287003fd48e4264e7056e274b84709ada31e3657f00eeedc1547e37") {
    ...PoolFields
  }
  usdcUsdtPool: object(address: "0x30066d9879374276dc01177fbd239a9377b497bcd347c82811d75fcda35b18e5") {
    ...PoolFields
  }
  usdyUsdcPool: object(address: "0xa7239a0c727c40ee3a139689b16b281acfd0682a06c23531b184a61721ece437") {
    ...PoolFields
  }
  suiUsdcPool: object(address: "0xee6f6392cbd9e1997f6e4cf71db0c1ae1611f1f5f7f23f90ad2c64b8f23cceab") {
    ...PoolFields
  }
  wethUsdcPool: object(address: "0xbdf4f673b34274f36be284bca3f765083380fefb29141f971db289294bf679c6") {
    ...PoolFields
  }
  wbtcUsdcPool: object(address: "0x676fc5cad79f51f6a7d03bfa3474ecd3c695d322380fc68e3d4f61819da3bf8a") {
    ...PoolFields
  }
  navxSuiPool: object(address: "0x045e4e3ccd383bedeb8fda54c39a7a1b1a6ed6a9f66aec4998984373558f96a0") {
    ...PoolFields
  }
  usdtPool: object(address: "0xc696ca5b8f21a1f8fcd62cff16bbe5a396a4bed6f67909cfec8269eb16e60757") {
    ...PoolFields
  }
  suiPool: object(address: "0x643f84e0a33b19e2b511be46232610c6eb38e772931f582f019b8bbfb893ddb3") {
    ...PoolFields
  }
  vsuiPool: object(address: "0x0d9598006d37077b4935400f6525d7f1070784e2d6f04765d76ae0a4880f7d0a") {
    ...PoolFields
  }
  usdcPool: object(address: "0x01493446093dfcdcfc6c16dc31ffe40ba9ac2e99a3f6c16a0d285bff861944ae") {
    ...PoolFields
  }
  wethPool: object(address: "0xe4eef7d4d8cafa3ef90ea486ff7d1eec347718375e63f1f778005ae646439aad") {
    ...PoolFields
  }
}

fragment PoolFields on Object {
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
