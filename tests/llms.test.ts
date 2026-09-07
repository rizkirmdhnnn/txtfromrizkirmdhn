import { describe, expect, it } from "vitest";
import { llmsTxt } from "../src/lib/llms";
import { kinds, type PublicData, type SiteData } from "../src/lib/cms";

function site(visible: string[]): SiteData {
  return {
    name: "Portfolio owner",
    brand: "ar",
    icon: "",
    handle: "owner",
    location: "Yogyakarta",
    avatar: "",
    email: "owner@example.com",
    whatsapp: "",
    github: "https://github.com/owner",
    linkedin: "",
    skills: ["TypeScript", "Cloudflare"],
    cv: "",
    setupCover: "",
    setupIntro: "",
    headline: "Fullstack & cloud",
    bio: "Building useful software.",
    note: "",
    aboutTitle: "About the owner",
    aboutBody: "A personal introduction.",
    footer: "",
    seoTitle: "",
    seoDescription: "",
    sections: kinds.map((key) => ({ key, visible: visible.includes(key) })),
    words: {},
    sectionSeo: {},
  };
}

function data(visible: string[]): PublicData {
  return {
    site: site(visible),
    entries: [
      {
        title: "Self-hosted email",
        summary: "Running your own mail server without the pain.",
        body: "",
        seoTitle: "",
        seoDescription: "",
        slug: "self-hosted-email",
        category: "writing",
        date: "2026-07-28",
        tags: [],
        pinned: false,
        demo: false,
        order: 0,
        cover: "",
        visual: "mail" as const,
        repo: "",
        demoUrl: "",
        group: "",
        updatedAt: "2026-08-01T10:00:00.000Z",
      },
    ],
    media: {},
    preview: false,
  };
}

describe("llmsTxt", () => {
  it("describes the owner, pages, and entries with links", () => {
    const txt = llmsTxt(
      "txtfromrizkirmdhn.my.id",
      data(["projects", "writing"]),
    );
    expect(txt).toContain("# Portfolio owner");
    expect(txt).toContain("> Fullstack & cloud");
    expect(txt).toContain("Location: Yogyakarta");
    expect(txt).toContain("Skills: TypeScript, Cloudflare");
    expect(txt).toContain(
      "[Projects](https://txtfromrizkirmdhn.my.id/): Featured work and projects",
    );
    expect(txt).toContain(
      "[Writing](https://txtfromrizkirmdhn.my.id/writing): Notes and articles",
    );
    expect(txt).not.toContain("[Experience]");
    expect(txt).toContain(
      "[Self-hosted email](https://txtfromrizkirmdhn.my.id/post/self-hosted-email): Running your own mail server without the pain. (2026-07-28)",
    );
  });

  it("handles an empty site", () => {
    const txt = llmsTxt("txtfromrizkirmdhn.my.id", {
      site: null,
      entries: [],
      media: {},
      preview: false,
    });
    expect(txt).toContain("# Portfolio");
    expect(txt).toContain("being prepared");
  });
});
