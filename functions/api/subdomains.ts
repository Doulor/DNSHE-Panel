export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const base =
    "https://api005.dnshe.com/index.php?m=domain_hub&endpoint=subdomains";

  if (request.method === "GET") {
    const res = await fetch(`${base}&action=list`, {
      headers: {
        "X-API-Key": env.DNSHE_KEY,
        "X-API-Secret": env.DNSHE_SECRET,
      },
    });
    return new Response(await res.text(), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const res = await fetch(`${base}&action=register`, {
      method: "POST",
      headers: {
        "X-API-Key": env.DNSHE_KEY,
        "X-API-Secret": env.DNSHE_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return new Response(await res.text(), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}