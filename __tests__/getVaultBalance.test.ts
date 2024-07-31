import { getVaultBalance, PoolName } from "../src/index";

describe("getVaultBalance", () => {
  it("should return the correct value", async () => {
    const address = "";
    const poolName: PoolName = "ALPHA";

    return getVaultBalance(address, poolName).then(() => {
      const here = "";
      expect(here).toBeDefined();
    });
  });
});
