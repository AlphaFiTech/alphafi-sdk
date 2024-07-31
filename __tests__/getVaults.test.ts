import { getVaults } from "../src/index";

describe("getVaults", () => {
  it("should return the correct value", async () => {
    const address = "";

    return getVaults(address).then((vaults) => {
      expect(vaults).toBeDefined();
    });
  });
});
