export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const base =
    "https://api005.dnshe.com/index.php?m=domain_hub&endpoint=dns_records";

  const target = `${base}&action=${action}`;

  const res = await fetch(target, {
    method: request.method,
    headers: {
      "X-API-Key": env.DNSHE_KEY,
      "X-API-Secret": env.DNSHE_SECRET,
      "Content-Type": "application/json",
    },
    body: request.method === "GET" ? null : await request.text(),
  });

  return new Response(await res.text(), {
    headers: { "Content-Type": "application/json" },
  });
}