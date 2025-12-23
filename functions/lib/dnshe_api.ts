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
    // API维护后可能需要在URL中包含认证信息
    let url = `${this.baseUrl}?m=domain_hub&endpoint=${endpoint}&action=${action}&api_key=${this.apiKey}&api_secret=${this.apiSecret}`;
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
        'User-Agent': 'DNSHE-Panel/1.0'  // 添加用户代理以符合API维护后的要求
      }
    };

    if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
    }

    try {
      const res = await fetch(url, options);

      // 检查HTTP状态码
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API请求失败: HTTP ${res.status} - ${res.statusText}`, errorText);
        throw new Error(`API请求失败: HTTP ${res.status} - ${res.statusText}`);
      }

      const result = await res.json();

      // 检查API返回的错误
      if (result.error) {
        console.error(`API返回错误:`, result.error);
        throw new Error(`API错误: ${result.error}`);
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