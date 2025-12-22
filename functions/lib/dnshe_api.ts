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
    let url = `${this.baseUrl}?m=domain_hub&endpoint=${endpoint}&action=${action}`;
    const options: RequestInit = {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret,
        'Content-Type': 'application/json'
      }
    };
    if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
    }

    const res = await fetch(url, options);
    return res.json();
  }

  listSubdomains() {
    return this.request('subdomains', 'list', 'GET');
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

  listDNSRecords(subdomain_id: number) {
    return this.request('dns_records', 'list', 'GET', { subdomain_id });
  }

  createDNSRecord(subdomain_id: number, type: string, content: string, name?: string, ttl?: number, priority?: number) {
    return this.request('dns_records', 'create', 'POST', { subdomain_id, type, content, name, ttl, priority });
  }

  updateDNSRecord(record_id: number, content?: string, ttl?: number, priority?: number) {
    return this.request('dns_records', 'update', 'POST', { record_id, content, ttl, priority });
  }

  deleteDNSRecord(record_id: number) {
    return this.request('dns_records', 'delete', 'POST', { record_id });
  }
}