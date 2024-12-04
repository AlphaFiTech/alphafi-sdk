import {
  getVaults,
  getAllVaults,
  getSingleAssetVaults,
  getAllSingleAssetVaults,
  getDoubleAssetVaults,
  getAllDoubleAssetVaults,
} from "..";

describe("getVaults", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";

    return getVaults(address).then((vaults) => {
      expect(vaults?.length).toBe(5);
    });
  });
});

describe("getAllVaults", () => {
  it("should return the correct value", async () => {
    return getAllVaults().then((vaults) => {
      expect(vaults?.length).toBe(37);
    });
  });
});

describe("getSingleAssetVaults", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";

    return getSingleAssetVaults(address).then((vaults) => {
      expect(vaults?.length).toBe(2);
    });
  });
});

describe("getAllSingleAssetVaults", () => {
  it("should return the correct value", async () => {
    return getAllSingleAssetVaults().then((vaults) => {
      expect(vaults?.length).toBe(16);
    });
  });
});

describe("getDoubleAssetVaults", () => {
  it("should return the correct value", async () => {
    const address =
      "0xbef197ee83f9c4962f46f271a50af25301585121e116173be25cd86286378e15";

    return getDoubleAssetVaults(address).then((vaults) => {
      expect(vaults?.length).toBe(3);
    });
  });
});

describe("getAllDoubleAssetVaults", () => {
  it("should return the correct value", async () => {
    return getAllDoubleAssetVaults().then((vaults) => {
      expect(vaults?.length).toBe(21);
    });
  });
});
