import { getApr, getAprs } from "..";

describe("getApr", () => {
  it("should return the correct value", async () => {
    return getApr("USDT-WUSDC").then((apr) => {
      expect(apr).toBeDefined();
    });
  });
});

describe("getAprs", () => {
  it("should return the correct value", async () => {
    return getAprs(["USDT-WUSDC"]).then((aprMap) => {
      expect(aprMap).toBeDefined();
    });
  });
});
