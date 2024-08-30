import {
  getAlphaVaultBalance,
  getSingleAssetVaultBalance,
  getDoubleAssetVaultBalance,
  PoolName,
} from "../dist";

describe("getVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";

    return getAlphaVaultBalance(address).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
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
  }, 10000);
});

describe("getNaviVsuiSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-VSUI";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getNaviWethSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-WETH";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getNaviUsdtSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-USDT";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getNaviUsdcSingleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVI-USDC";

    return getSingleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

// Double Asset Vaults

describe("getUsdtUsdcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "USDT-USDC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getHasuiSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "HASUI-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getUsdyUsdcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "USDY-USDC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getAlphaSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "ALPHA-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getUsdcSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "USDC-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getUsdcWbtcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "USDC-WBTC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getWethUsdcDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "WETH-USDC";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});

describe("getNavxSuiDoubleAssetVaultBalance", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";
    const poolName: PoolName = "NAVX-SUI";

    return getDoubleAssetVaultBalance(address, poolName).then((balance) => {
      expect(balance).toBeDefined();
    });
  }, 10000);
});
