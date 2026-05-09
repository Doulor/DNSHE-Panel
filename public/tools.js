// Minimal frontend for keys/quota/whois demo
async function fetchJson(path, opts) {
  const res = await fetch(path, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return { success: false, raw: text }; }
}

async function loadKeys() {
  const res = await fetchJson('/api/keys');
  const tbody = document.querySelector('#keysTable tbody');
  tbody.innerHTML = '';
  if (!res || res.success === false) {
    tbody.innerHTML = `<tr><td colspan="7">无法加载：${res && res.error ? res.error : '未知错误'}</td></tr>`;
    return;
  }
  const keys = res.keys || [];
  if (keys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">没有 API Key</td></tr>';
    return;
  }
  keys.forEach(k => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${k.id || ''}</td>
      <td>${k.key_name || ''}</td>
      <td>${k.api_key || ''}</td>
      <td>${k.status || ''}</td>
      <td>${k.request_count || ''}</td>
      <td>${k.last_used_at || ''}</td>
      <td>
        <button class="btn regen" data-id="${k.id}">再生</button>
        <button class="btn danger delete" data-id="${k.id}">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function createKey() {
  const name = prompt('请输入 API Key 名称');
  if (!name) return;
  const ip = prompt('可选：IP 白名单（逗号分隔），留空则不限制');
  const res = await fetchJson('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', key_name: name, ip_whitelist: ip }) });
  alert(res && res.success ? `创建成功，请保存 api_secret: ${res.api_secret || '(无)'} \n api_key: ${res.api_key || '(无)'}` : `创建失败: ${res && res.error ? res.error : '未知'}`);
  await loadKeys();
}

async function regenKey(id) {
  if (!confirm('确定要重新生成该 API Key 的 secret 吗？旧 secret 将失效')) return;
  const res = await fetchJson('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'regenerate', key_id: id }) });
  alert(res && res.success ? `再生成功，新 secret: ${res.api_secret || '(无)'}` : `再生失败: ${res && res.error ? res.error : '未知'}`);
  await loadKeys();
}

async function deleteKey(id) {
  if (!confirm('确定删除该 API Key ？')) return;
  const res = await fetchJson('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', key_id: id }) });
  alert(res && res.success ? '删除成功' : `删除失败: ${res && res.error ? res.error : '未知'}`);
  await loadKeys();
}

async function getQuota() {
  const res = await fetchJson('/api/quota');
  const el = document.getElementById('quotaBlock');
  if (!res || res.success === false) {
    el.textContent = `错误: ${res && res.error ? res.error : '未知'}`;
    return;
  }
  const q = res.quota || {};
  el.innerHTML = `<pre>${JSON.stringify(q, null, 2)}</pre>`;
}

async function whois() {
  const domain = document.getElementById('whoisDomain').value.trim();
  if (!domain) { alert('请输入域名'); return; }
  const res = await fetchJson(`/api/whois?domain=${encodeURIComponent(domain)}`);
  const el = document.getElementById('whoisResult');
  el.textContent = JSON.stringify(res, null, 2);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshKeys').addEventListener('click', loadKeys);
  document.getElementById('createKeyBtn').addEventListener('click', createKey);
  document.querySelector('#keysTable').addEventListener('click', (e) => {
    if (e.target.matches('.regen')) regenKey(e.target.dataset.id);
    if (e.target.matches('.delete')) deleteKey(e.target.dataset.id);
  });
  document.getElementById('getQuotaBtn').addEventListener('click', getQuota);
  document.getElementById('whoisBtn').addEventListener('click', whois);

  loadKeys();
});
