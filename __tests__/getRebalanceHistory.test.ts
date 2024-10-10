import { getRebalanceHistory, getRebalanceHistories } from "..";

describe("getRebalanceHistory", () => {
  it("should return the correct value", async () => {
    return getRebalanceHistory("USDT-WUSDC").then((history) => {
      expect(history).toBeDefined();
    });
  });
});

describe("getRebalanceHistories", () => {
  it("should return the correct value", async () => {
    return getRebalanceHistories(["USDT-WUSDC"]).then((historyMap) => {
      expect(historyMap).toBeDefined();
    });
  });
});
