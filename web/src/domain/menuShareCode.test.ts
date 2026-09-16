import { describe, expect, it } from "vitest";
import { decodeMenu, encodeMenu, type MenuPayload } from "./menuShareCode";

describe("encodeMenu / decodeMenu", () => {
  it("round-trips a menu payload", () => {
    const payload: MenuPayload = {
      barName: "Le Bar à Claude",
      items: [
        { cocktailId: "mojito", price: 12 },
        { cocktailId: "old_fashioned", price: null },
      ],
    };
    const code = encodeMenu(payload);
    expect(decodeMenu(code)).toEqual(payload);
  });

  it("returns null for a corrupted code", () => {
    expect(decodeMenu("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for a code missing required fields", () => {
    const code = encodeMenu({ barName: "", items: [] } as unknown as MenuPayload);
    expect(decodeMenu(code)).toBeNull();
  });

  it("returns null for valid JSON that isn't a menu payload", () => {
    const code = btoa(JSON.stringify({ hello: "world" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeMenu(code)).toBeNull();
  });
});
