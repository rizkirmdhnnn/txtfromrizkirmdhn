import type { Kind } from "./cms";

export const tabPaths = {
  projects: "/",
  experience: "/experience",
  writing: "/writing",
  about: "/about",
} as const;

export type TabPath = (typeof tabPaths)[Kind];
