import {
  getAlphaVaultBalance,
  getSingleAssetVaultBalance,
  getDoubleAssetVaultBalance,
  PoolName,
} from "..";

describe("getVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";

    return getAlphaVaultBalance(address).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

// Single Asset Vaults

describe("getNaviSuiSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    // const address =
    //   '0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15';
    const address =
      "0x7383b5e076553f79822374baca843c8fac02d510fb0f4ab344fc7ab591be94a7";
    const poolName: PoolName = "NAVI-SUI";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getNaviVsuiSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-VSUI";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getNaviWethSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-WETH";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getNaviUsdtSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-USDT";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getNaviWusdcSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-WUSDC";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getNaviUsdcSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-USDC";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getNaviLoopUsdcUsdtSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-LOOP-USDC-USDT";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

// Double Asset Vaults

describe("getUsdtUsdcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "USDT-WUSDC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getAlphaSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "ALPHA-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getUsdcSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "WUSDC-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getUsdcWbtcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "WUSDC-WBTC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getWethUsdcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "WETH-WUSDC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getNavxSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVX-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getCetusSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "CETUS-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getAlphaUsdcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "ALPHA-WUSDC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getWsolUsdcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "WSOL-WUSDC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

describe("getFudSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "FUD-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  });
});

// describe("getBlubSuiDoubleAssetVaultBalance", () => {
//   it("should return the correct value", async () => {
//     const address =
//       "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
//     const poolName: PoolName = "BLUB-SUI";

//     return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
//       expect(balance).toBeDefined();
//     });
//   });
// });

// describe("getScaSuiDoubleAssetVaultBalance", () => {
//   it("should return the correct value", async () => {
//     const address =
//       "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
//     const poolName: PoolName = "SCA-SUI";

//     return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
//       expect(balance).toBeDefined();
//     });
//   });
// });
