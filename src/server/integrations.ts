export async function boundedText(response: Response, limit: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Response("Response is too large", { status: 502 });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(out);
}
export async function analytics(env: Env, days: number) {
  if (!env.CF_ACCOUNT_ID || !env.ANALYTICS_SITE_TAG || !env.CF_ANALYTICS_TOKEN)
    return {
      configured: false,
      message:
        "Statistics have not been configured. Add the Cloudflare Analytics bindings.",
    };
  const cached = await env.DB.prepare(
    "SELECT value FROM analytics_cache WHERE id=? AND expires>?",
  )
    .bind(String(days), Date.now())
    .first<{ value: string }>();
  if (cached) return JSON.parse(cached.value);
  const since = new Date(Date.now() - days * 86400000).toISOString(),
    until = new Date().toISOString();
  const query = `query Stats($account:String!,$filter:AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!){viewer{accounts(filter:{accountTag:$account}){totals:rumPageloadEventsAdaptiveGroups(limit:1,filter:$filter){sum{visits}count}pages:rumPageloadEventsAdaptiveGroups(limit:10,filter:$filter,orderBy:[count_DESC]){count dimensions{requestPath}}}}}`;
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        account: env.CF_ACCOUNT_ID,
        filter: {
          datetime_geq: since,
          datetime_lt: until,
          siteTag: env.ANALYTICS_SITE_TAG,
          requestHost: env.PUBLIC_HOST,
        },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    return {
      configured: true,
      error: true,
      message: "Statistics are currently unavailable.",
    };
  const json = JSON.parse(await boundedText(response, 100000));
  if (json.errors || !json.data?.viewer?.accounts?.[0])
    return {
      configured: true,
      error: true,
      message:
        "Statistics data is unavailable. Check token permissions and site configuration.",
    };
  const account = json.data.viewer.accounts[0];
  const result = {
    configured: true,
    visits: account.totals[0]?.sum?.visits ?? 0,
    views: account.totals[0]?.count ?? 0,
    pages: account.pages.map(
      (p: { count: number; dimensions: { requestPath: string } }) => ({
        path: p.dimensions.requestPath,
        views: p.count,
      }),
    ),
    updatedAt: until,
  };
  await env.DB.prepare(
    "INSERT INTO analytics_cache(id,value,expires) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,expires=excluded.expires",
  )
    .bind(String(days), JSON.stringify(result), Date.now() + 900000)
    .run();
  return result;
}
