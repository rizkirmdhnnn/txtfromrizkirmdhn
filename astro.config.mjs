import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { google } from "emdash/auth/providers/google";

const cloudflareBuild = process.env.NODE_ENV === "production";

export default defineConfig({
	output: "server",
	adapter: cloudflareBuild ? cloudflare() : node({ mode: "standalone" }),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: cloudflareBuild
				? d1({ binding: "DB", session: "auto", coalesce: true })
				: sqlite({ url: "file:./data.db" }),
			storage: cloudflareBuild
				? r2({ binding: "MEDIA" })
				: local({
						directory: "./uploads",
						baseUrl: "/_emdash/api/media/file",
					}),
			authProviders: [google()],
			toolbar: false,
			admin: {
				siteName: "Rizki Portfolio",
			},
		}),
	],
	devToolbar: { enabled: false },
});
