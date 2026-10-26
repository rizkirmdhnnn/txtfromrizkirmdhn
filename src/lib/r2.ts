import { env } from "cloudflare:workers";

export function mediaBucket() {
	return (env as any).MEDIA as R2Bucket | undefined;
}
