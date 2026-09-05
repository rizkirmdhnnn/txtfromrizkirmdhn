import { useLoaderData, useRouter } from "@tanstack/react-router";

export function useAdminData() {
  return useLoaderData({ from: "/admin" });
}

export function useRefresh() {
  const router = useRouter();
  return () => router.invalidate();
}
