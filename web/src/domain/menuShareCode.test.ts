import { describe, expect, it } from "vitest";
import { decodeMenu, encodeMenu, type MenuPayload } from "./menuShareCode";

describe("encodeMenu / decodeMenu", () => {
  it("round-trips a menu payload", () => {
    const payload: MenuPayload = {
      barName: "Le Bar à Claude",
      layout: "grid2",
      itemsPerPage: undefined,
      theme: "classic",
      printFormat: "a4",
      items: [
        { cocktailId: "mojito", price: 12, featured: false },
        { cocktailId: "old_fashioned", price: null, featured: false },
      ],
    };
    const code = encodeMenu(payload);
    expect(decodeMenu(code)).toEqual(payload);
  });

  it("round-trips itemsPerPage and featured flags", () => {
    const payload: MenuPayload = {
      barName: "Le Bar à Claude",
      layout: "pages",
      itemsPerPage: 1,
      theme: "instagram",
      printFormat: "a5",
      items: [{ cocktailId: "mojito", price: 12, featured: true }],
    };
    const code = encodeMenu(payload);
    expect(decodeMenu(code)).toEqual(payload);
  });

  it("round-trips a logo and a story with text and image", () => {
    const payload: MenuPayload = {
      barName: "Le Bar à Claude",
      layout: "list",
      theme: "apple",
      logo: "data:image/jpeg;base64,AAAA",
      story: { text: "Fondé en 2020…", image: "data:image/jpeg;base64,BBBB" },
      printFormat: "a5",
      items: [{ cocktailId: "mojito", price: 9, featured: false }],
    };
    const code = encodeMenu(payload);
    expect(decodeMenu(code)).toEqual(payload);
  });

  it("drops a logo that isn't a valid image data URI (forged payload)", () => {
    const code = btoa(
      JSON.stringify({ barName: "X", layout: "list", logo: "not-an-image", items: [{ cocktailId: "mojito", price: null }] }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodeMenu(code)?.logo).toBeUndefined();
  });

  it("drops an unknown theme value and falls back to 'classic'", () => {
    const code = encodeMenu({ barName: "X", layout: "list", theme: "neon" as MenuPayload["theme"], items: [{ cocktailId: "mojito", price: null }] });
    expect(decodeMenu(code)?.theme).toBe("classic");
  });

  it("drops an unknown printFormat value and falls back to 'a5'", () => {
    const code = encodeMenu({
      barName: "X",
      layout: "list",
      printFormat: "letter" as MenuPayload["printFormat"],
      items: [{ cocktailId: "mojito", price: null }],
    });
    expect(decodeMenu(code)?.printFormat).toBe("a5");
  });

  it("returns null for a corrupted code", () => {
    expect(decodeMenu("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for a code missing required fields", () => {
    const code = encodeMenu({ barName: "", layout: "list", items: [] } as unknown as MenuPayload);
    expect(decodeMenu(code)).toBeNull();
  });

  it("returns null for valid JSON that isn't a menu payload", () => {
    const code = btoa(JSON.stringify({ hello: "world" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeMenu(code)).toBeNull();
  });

  it("falls back to layout 'list' for a link generated before layouts existed", () => {
    const code = btoa(JSON.stringify({ barName: "Ancien lien", items: [{ cocktailId: "mojito", price: 9 }] }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodeMenu(code)).toEqual({
      barName: "Ancien lien",
      layout: "list",
      itemsPerPage: undefined,
      theme: "classic",
      printFormat: "a5",
      items: [{ cocktailId: "mojito", price: 9, featured: false }],
    });
  });

  it("ignores an unknown layout value and falls back to 'list'", () => {
    const code = encodeMenu({ barName: "X", layout: "spiral" as MenuPayload["layout"], items: [{ cocktailId: "mojito", price: null }] });
    expect(decodeMenu(code)?.layout).toBe("list");
  });
});
