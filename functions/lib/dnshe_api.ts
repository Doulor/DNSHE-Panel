export class DNSHESubdomainAPI {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;

  constructor(baseUrl: string, apiKey: string, apiSecret: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async request(endpoint: string, action: string, method: string = 'GET', data: any = null) {
    // New API requires authentication via request headers (X-API-Key / X-API-Secret)
    let url = `${this.baseUrl}?m=domain_hub&endpoint=${endpoint}&action=${action}`;
    if (method === 'GET' && data) {
      // 添加GET请求的参数
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      if (params.toString()) {
        url += `&${params.toString()}`;
      }
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DNSHE-Panel/1.0',  // 添加用户代理以符合API维护后的要求
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret
      }
    };

    // For non-GET methods attach JSON body when provided
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    try {
      const res = await fetch(url, options);

      // 检查HTTP状态码
      const text = await res.text();
      let result: any = null;
      try {
        result = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error('无法解析API响应为JSON:', text);
        throw new Error(`API返回不可解析的响应: HTTP ${res.status}`);
      }

      if (!res.ok) {
        console.error(`API请求失败: HTTP ${res.status} - ${res.statusText}`, result || text);
        const msg = (result && (result.message || result.error)) || res.statusText;
        throw new Error(`API请求失败: HTTP ${res.status} - ${msg}`);
      }

      // 统一V2.0接口返回: { success: boolean, ... }
      if (result && result.success === false) {
        const errMsg = result.message || result.error || JSON.stringify(result);
        console.error('API返回失败:', result);
        throw new Error(errMsg);
      }

      // 保留向后兼容：如果存在error字段，也视为失败
      if (result && result.error) {
        console.error('API返回错误字段:', result.error);
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error(`请求 ${url} 时发生错误:`, error);
      throw error;
    }
  }

  listSubdomains() {
    return this.request('subdomains', 'list', 'GET');
  }

  getSubdomain(subdomain_id: number) {
    return this.request('subdomains', 'get', 'GET', { subdomain_id });
  }

  registerSubdomain(subdomain: string, rootdomain: string) {
    return this.request('subdomains', 'register', 'POST', { subdomain, rootdomain });
  }

  deleteSubdomain(subdomain_id: number) {
    return this.request('subdomains', 'delete', 'POST', { subdomain_id });
  }

  renewSubdomain(subdomain_id: number) {
    return this.request('subdomains', 'renew', 'POST', { subdomain_id });
  }

  listDnsRecords(subdomain_id: number) {
    return this.request('dns_records', 'list', 'GET', { subdomain_id });
  }

  createDnsRecord(subdomain_id: number, type: string, content: string, name?: string, ttl?: number, priority?: number) {
    const data: any = { subdomain_id, type, content };
    if (name !== undefined) data.name = name;
    if (ttl !== undefined) data.ttl = ttl;
    if (priority !== undefined) data.priority = priority;
    return this.request('dns_records', 'create', 'POST', data);
  }

  updateDnsRecord(record_id: number, content?: string, ttl?: number, priority?: number) {
    return this.request('dns_records', 'update', 'POST', { record_id, content, ttl, priority });
  }

  deleteDnsRecord(record_id: number) {
    return this.request('dns_records', 'delete', 'POST', { record_id });
  }
}