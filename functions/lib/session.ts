// 会话：HMAC-SHA256 签名的无状态令牌，通过 HttpOnly Cookie 下发
// 令牌格式: base64url(exp|nonce).base64url(hmac)

const COOKIE_NAME = 'dns_panel_session';

// 由密码派生的签名密钥，避免要求新增环境变量；设置 SESSION_SECRET 可获得独立密钥
async function getSigningSecret(env: { [key: string]: string }): Promise<string> {
  const explicit = env.SESSION_SECRET;
  if (explicit && explicit.trim() !== '') return explicit;

  const password = env.DNS_PANEL_PASSWORD || '';
  const data = new TextEncoder().encode(`dns-panel-session-v1:${password}:${env.DNSHE_SECRET_1 || ''}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(mac));
}

export function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get('Cookie') || '';
  const cookies: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) cookies[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return cookies;
}

export async function createSessionToken(env: { [key: string]: string }, days = 7): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const body = btoa(`${exp}|${toBase64Url(nonceBytes)}`).replace(/=+$/, '');
  const secret = await getSigningSecret(env);
  return `${body}.${await sign(body, secret)}`;
}

export async function isValidSession(request: Request, env: { [key: string]: string }): Promise<boolean> {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return false;

  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const secret = await getSigningSecret(env);
  const expected = await sign(body, secret);
  if (signature.length !== expected.length) return false;
  // 定长比较，避免时序侧信道
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return false;

  try {
    const [exp] = fromBase64Url(body).split('|');
    return Number(exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function buildSessionCookie(token: string, maxAgeSeconds: number): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

export function buildClearCookie(): string {
  return buildSessionCookie('', 0);
}
