import { getRebalanceHistory, getRebalanceHistories } from "../dist";

describe("getRebalanceHistory", () => {
  it("should return the correct value", async () => {
    return getRebalanceHistory("USDT-USDC").then((history) => {
      expect(history).toBeDefined();
    });
  });
});

describe("getRebalanceHistories", () => {
  it("should return the correct value", async () => {
    return getRebalanceHistories(["USDT-USDC"]).then((historyMap) => {
      expect(historyMap).toBeDefined();
    });
  });
});
