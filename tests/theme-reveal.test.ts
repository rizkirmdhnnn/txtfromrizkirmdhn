import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createThemeReveal } from "../src/lib/theme-reveal";

const scope = vi.hoisted(() => ({
  animate: vi.fn(),
  cancel: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock("../src/lib/motion", () => ({
  motionEase: "ease-out",
  createMotionScope: () => scope,
}));

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function snapshot(update: () => void) {
  const ready = deferred();
  const finished = deferred();
  return {
    update,
    ready,
    finished,
    value: {
      ready: ready.promise,
      finished: finished.promise,
      skipTransition: vi.fn(),
    },
  };
}

describe("theme reveal interruption and fallback", () => {
  let media: EventTarget & { matches: boolean };
  let doc: EventTarget & {
    documentElement: {
      dataset: Record<string, string>;
      style: {
        setProperty: ReturnType<typeof vi.fn>;
        removeProperty: ReturnType<typeof vi.fn>;
      };
    };
    hidden: boolean;
    startViewTransition?: ReturnType<typeof vi.fn>;
  };
  let controller: ReturnType<typeof createThemeReveal>;
  const button = {
    querySelector: () => null,
    getBoundingClientRect: () => ({ left: 20, top: 20, width: 44, height: 44 }),
  } as unknown as HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    media = Object.assign(new EventTarget(), { matches: false });
    doc = Object.assign(new EventTarget(), {
      documentElement: {
        dataset: {},
        style: { setProperty: vi.fn(), removeProperty: vi.fn() },
      },
      hidden: false,
    });
    vi.stubGlobal("document", doc);
    vi.stubGlobal("matchMedia", () => media);
    vi.stubGlobal("innerWidth", 1280);
    vi.stubGlobal("innerHeight", 800);
    controller = createThemeReveal();
  });
  afterEach(() => {
    controller.dispose();
    vi.unstubAllGlobals();
  });

  it("applies immediately when View Transitions are unavailable", () => {
    const update = vi.fn();
    controller.change(button, update);
    expect(update).toHaveBeenCalledTimes(1);
    expect(doc.documentElement.dataset.themeReveal).toBeUndefined();
  });

  it("does not capture snapshots or animate icons with reduced motion", () => {
    media.matches = true;
    doc.startViewTransition = vi.fn();
    const update = vi.fn();
    controller.change(button, update);
    expect(update).toHaveBeenCalledTimes(1);
    expect(doc.startViewTransition).not.toHaveBeenCalled();
    expect(scope.animate).not.toHaveBeenCalled();
  });

  it("ignores stale callbacks after rapid changes and retains the latest reveal", async () => {
    const snapshots: ReturnType<typeof snapshot>[] = [];
    doc.startViewTransition = vi.fn((update) => {
      const next = snapshot(update);
      snapshots.push(next);
      return next.value;
    });
    const first = vi.fn(),
      latest = vi.fn();
    controller.change(button, first);
    controller.change(button, latest);
    expect(snapshots[0].value.skipTransition).toHaveBeenCalledTimes(1);
    snapshots[1].update();
    snapshots[0].update();
    snapshots[0].ready.reject(new Error("Skipped"));
    snapshots[0].finished.resolve();
    await Promise.resolve();
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    expect(doc.documentElement.dataset.themeReveal).toBe("true");
    snapshots[1].ready.resolve();
    snapshots[1].finished.resolve();
    await Promise.resolve();
    expect(doc.documentElement.dataset.themeReveal).toBeUndefined();
  });

  it.each(["reduced motion", "hidden document"])(
    "settles the pending choice once when interrupted by %s",
    async (reason) => {
      let pending!: ReturnType<typeof snapshot>;
      doc.startViewTransition = vi.fn(
        (update) => (pending = snapshot(update)).value,
      );
      const update = vi.fn();
      controller.change(button, update);
      if (reason === "reduced motion") {
        media.matches = true;
        media.dispatchEvent(new Event("change"));
      } else {
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
      }
      pending.update();
      pending.ready.reject(new Error("Skipped"));
      pending.finished.resolve();
      await Promise.resolve();
      expect(update).toHaveBeenCalledTimes(1);
      expect(pending.value.skipTransition).toHaveBeenCalledTimes(1);
      expect(doc.documentElement.dataset.themeReveal).toBeUndefined();
    },
  );

  it("keeps the selected theme when snapshot capture fails", async () => {
    let pending!: ReturnType<typeof snapshot>;
    doc.startViewTransition = vi.fn(
      (update) => (pending = snapshot(update)).value,
    );
    const update = vi.fn();
    controller.change(button, update);
    pending.ready.reject(new Error("Capture failed"));
    pending.finished.reject(new Error("Capture failed"));
    await Promise.resolve();
    await Promise.resolve();
    pending.update();
    expect(update).toHaveBeenCalledTimes(1);
    expect(doc.documentElement.dataset.themeReveal).toBeUndefined();
  });

  it("invalidates queued callbacks on unmount", async () => {
    let pending!: ReturnType<typeof snapshot>;
    doc.startViewTransition = vi.fn(
      (update) => (pending = snapshot(update)).value,
    );
    const update = vi.fn();
    controller.change(button, update);
    scope.animate.mockClear();
    controller.dispose();
    pending.update();
    pending.ready.resolve();
    pending.finished.resolve();
    await Promise.resolve();
    expect(update).not.toHaveBeenCalled();
    expect(scope.animate).not.toHaveBeenCalled();
    expect(doc.documentElement.dataset.themeReveal).toBeUndefined();
  });

  it("responds before snapshot readiness and originates at the button center", () => {
    doc.startViewTransition = vi.fn((update) => snapshot(update).value);
    controller.change(button, vi.fn());
    expect(scope.animate).toHaveBeenCalledTimes(1);
    expect(scope.animate.mock.invocationCallOrder[0]).toBeLessThan(
      doc.startViewTransition.mock.invocationCallOrder[0],
    );
    expect(doc.documentElement.style.setProperty).toHaveBeenCalledWith(
      "--theme-reveal-x",
      `${(42 / 1280) * 100}%`,
    );
    expect(doc.documentElement.style.setProperty).toHaveBeenCalledWith(
      "--theme-reveal-y",
      `${(42 / 800) * 100}%`,
    );
    expect(doc.documentElement.style.setProperty).toHaveBeenCalledWith(
      "--theme-reveal-radius",
      `${(Math.ceil(Math.hypot(1280 - 42, 800 - 42)) / (Math.hypot(1280, 800) / Math.SQRT2)) * 100}%`,
    );
    controller.cancel();
    expect(doc.documentElement.style.removeProperty).toHaveBeenCalledWith(
      "--theme-reveal-radius",
    );
  });
});
