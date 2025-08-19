import config from './config.js';
import fetch from 'node-fetch';

class Postgrest {

  async queryTable(table, params = {}, headers={}) {
    const url = `${config.postgrest.host.value}/${table}?${new URLSearchParams(params).toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this._getHeaders(headers)
    });
    if (!response.ok) {
      throw new Error(`PostgREST query failed: ${response.statusText}`);
    }
    return response.json();
  }

  async queryTableCount(table, params = {}, headers={}) {
    const url = `${config.postgrest.host.value}/${table}?${new URLSearchParams(params).toString()}`;
    const response = await fetch(url, {
      method: 'HEAD',
      headers: this._getHeaders({...headers, 'Prefer': 'count=exact'})
    });
    if (!response.ok) {
      throw new Error(`PostgREST query failed: ${response.statusText}`);
    }
    const count = response.headers.get('Content-Range');
    if (!count) {
      throw new Error('Count header not found in response');
    }
    const totalCount = parseInt(count.split('/')[1], 10);
    return totalCount;
  }

  async rpc(functionName, body, headers={}, returnPayload) {
    const url = `${config.postgrest.host.value}/rpc/${functionName}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this._getHeaders(headers),
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`PostgREST RPC call failed: ${response.statusText}`);
    }
    if (returnPayload) {
      return response.json();
    }
    return response;
  }

  _getHeaders(headers={}) {
    return {
      'Content-Type': 'application/json',
      ...headers
    };
  }

}

export default new Postgrest();
