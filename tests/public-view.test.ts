import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicView } from "../src/components/public-view";
import {
  emptyEntry,
  kinds,
  type Kind,
  type PublicData,
  type SiteData,
} from "../src/lib/cms";

function site(): SiteData {
  return {
    name: "Portfolio owner",
    brand: "ar",
    icon: "",
    handle: "owner",
    location: "Yogyakarta",
    avatar: "",
    email: "",
    whatsapp: "",
    github: "",
    linkedin: "",
    skills: [],
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
    sections: kinds.map((key) => ({ key, visible: true })),
    words: {},
  };
}

function entry(title: string, category: Kind = "projects") {
  return {
    ...emptyEntry(category),
    title,
    slug: title.toLowerCase().replaceAll(" ", "-"),
  };
}

function render(data: Partial<PublicData> = {}, tab: Kind = "projects") {
  return renderToStaticMarkup(
    createElement(PublicView, {
      data: { site: site(), entries: [], media: {}, preview: true, ...data },
      tab,
      onTab() {},
      onPost() {},
      onBack() {},
    }),
  );
}

describe("public portfolio content", () => {
  it("features the pinned project once and keeps remaining CMS projects in order", () => {
    const first = entry("First project");
    const featured = { ...entry("Pinned project"), pinned: true };
    const last = entry("Last project");
    const html = render({ entries: [first, featured, last] });
    expect(html.match(/<article/g)).toHaveLength(3);
    expect(html.match(/>Pinned project</g)).toHaveLength(1);
    expect(html.indexOf(">Pinned project<")).toBeLessThan(
      html.indexOf(">First project<"),
    );
    expect(html.indexOf(">First project<")).toBeLessThan(
      html.indexOf(">Last project<"),
    );
  });

  it("renders a single unpinned project without adding examples or a featured claim", () => {
    const html = render({ entries: [entry("Only real project")] });
    expect(html.match(/<article/g)).toHaveLength(1);
    expect(html).not.toContain("Featured project");
    expect(html).not.toContain("work-grid");
    expect(html).not.toContain("Cloud drive");
  });

  it("shows the newest writing only while the writing section is visible", () => {
    const profile = site();
    const entries = [
      {
        ...entry("Old pinned note", "writing"),
        date: "2026-01-01",
        pinned: true,
      },
      { ...entry("Latest note", "writing"), date: "2026-09-01", demo: true },
    ];
    const html = render({ site: profile, entries });
    expect(html).toContain("Latest note");
    expect(html).toContain("Demo content");
    expect(html).not.toContain("Old pinned note");
    profile.sections = profile.sections.map((s) => ({
      ...s,
      visible: s.key !== "writing",
    }));
    expect(render({ site: profile, entries })).not.toContain("Latest note");
  });

  it("honors section visibility and does not link an empty category to hidden projects", () => {
    const profile = site();
    profile.sections = profile.sections.map((s) => ({
      ...s,
      visible: s.key === "experience",
    }));
    const html = render({ site: profile, entries: [entry("Hidden project")] });
    expect(html).toContain("Experience details are being prepared");
    expect(html).not.toContain("Hidden project");
    expect(html).not.toContain("Browse projects");
    profile.sections = profile.sections.map((s) => ({ ...s, visible: false }));
    expect(render({ site: profile })).toContain(
      "More work and stories will be shared",
    );
  });

  it("preserves owner copy, skips unavailable actions, and distinguishes About from empty content", () => {
    const profile = site();
    profile.words.selectedWork = "Things I have built";
    const html = render({ site: profile });
    expect(html).toContain("Things I have built");
    expect(html).not.toContain("View CV");
    expect(html).not.toContain("Let’s connect");
    const about = render({ site: profile }, "about");
    expect(about).toContain("A personal introduction.");
    expect(about).not.toContain(
      "More about this personal space is coming soon.",
    );
    expect(render({ site: null })).toContain("Coming soon.");
  });
});

describe("gallery and setup tabs", () => {
  it("renders one photo tile per gallery item and keeps details out of the grid", () => {
    const photos = [
      { ...entry("Desk at night", "gallery"), cover: "/api/media/p-1" },
      {
        ...entry("Keyboard close-up", "gallery"),
        cover: "/api/media/p-2",
        summary: "Lubed switches.",
      },
    ];
    const html = render({ entries: photos }, "gallery");
    expect(html.match(/class="gallery-tile"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Desk at night"');
    expect(html).toContain('src="/api/media/p-1"');
    expect(html).not.toContain("Lubed switches.");
    expect(html).not.toContain("lightbox");
    expect(render({}, "gallery")).toContain("Photos are on the way.");
  });

  it("renders setup as a spec sheet grouped by category, with only the desk photo as an image", () => {
    const profile = site();
    profile.setupCover = "/api/media/desk";
    profile.setupIntro = "Where the work happens.";
    const gear = [
      {
        ...entry("Monitor", "setup"),
        group: "Hardware",
        demoUrl: "https://example.com/monitor",
        summary: "27 inch, 4K.",
        cover: "/api/media/monitor",
      },
      { ...entry("VS Code", "setup"), group: "Software", body: "Extensions." },
      { ...entry("Lamp", "setup") },
    ];
    const html = render({ site: profile, entries: gear }, "setup");
    expect(html).toContain('src="/api/media/desk"');
    expect(html).toContain("Where the work happens.");
    expect(html.match(/class="spec-cat"/g)).toHaveLength(3);
    expect(html.indexOf(">Hardware<")).toBeLessThan(html.indexOf(">Software<"));
    expect(html).toContain(">Other<");
    expect(html).toContain('href="https://example.com/monitor"');
    expect(html).toContain("27 inch, 4K.");
    // Foto per item dan catatan panjang sengaja tidak tampil di arah ini.
    expect(html).not.toContain("/api/media/monitor");
    expect(html).not.toContain("Read more");
    expect(html).not.toContain("The setup is being documented");
    const single = render({ entries: [gear[2]] }, "setup");
    expect(single).toContain("spec-flat");
    expect(single).not.toContain("spec-cat");
    expect(render({}, "setup")).toContain("The setup is being documented");
  });

  it("hides the new tabs until they are enabled in the profile", () => {
    const profile = site();
    profile.sections = profile.sections.map((s) => ({
      ...s,
      visible: s.key !== "gallery" && s.key !== "setup",
    }));
    const html = render(
      {
        site: profile,
        entries: [
          { ...entry("Hidden photo", "gallery"), cover: "/api/media/h" },
        ],
      },
      "gallery",
    );
    expect(html).not.toContain("gallery-tile");
    expect(html).not.toContain(">Gallery<");
    expect(html).toContain("Selected work");
  });
});
