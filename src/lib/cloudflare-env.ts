import { env } from "cloudflare:workers";

export function runtimeEnv() {
	return env as unknown as Record<string, string | undefined>;
}
