import { getApr, getAprs } from "../dist";

describe("getApr", () => {
  it("should return the correct value", async () => {
    return getApr("USDT-USDC").then((apr) => {
      expect(apr).toBeDefined();
    });
  });
});

describe("getAprs", () => {
  it("should return the correct value", async () => {
    return getAprs(["USDT-USDC"]).then((aprMap) => {
      expect(aprMap).toBeDefined();
    });
  });
});
