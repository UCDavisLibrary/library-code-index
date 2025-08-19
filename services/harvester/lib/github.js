import config from '../../lib/config.js';
import logger from './logger.js';
import postgrest from '../../lib/postgrest.js';

class Github {
  constructor() {
    this.token = config.github.token;
    this.tokenId = 'primary';
  }

  async searchOrgs(query, options = {}) {
    const params = new URLSearchParams({
      q: `${query} type:org`,
      ...options
    });
    const path = `search/users?${params.toString()}`;
    logger.info(`Searching GitHub for organizations with query: ${query}`, { options, path });
    const { payload, nextPageUrl, nextPage } = await this.fetch(path, {
      method: 'GET'
    });
    return {
      payload,
      nextPageUrl,
      nextPage
    };
  }

  async fetchOrgDetails(orgName) {
    const path = `orgs/${orgName}`;
    logger.info(`Fetching details for organization: ${orgName}`, { path });
    const { payload } = await this.fetch(path, {
      method: 'GET'
    });
    return payload;
  }

  async fetch(path, options = {}) {
    try {
      const baseUrl = 'https://api.github.com';
      if (path.startsWith('https://')) {
        path = path.replace(/^https:\/\/api\.github\.com\/?/, '');
      }
      if (path.startsWith('/')) {
      path = path.slice(1);
    }
    const url = `${baseUrl}/${path}`;
    if (!this.token.value) {
      throw new Error('GITHUB_TOKEN environment variable is not set');
    }

    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token.value}`,
      'Accept': 'application/vnd.github+json'
    };

    const optionsMinusToken = JSON.parse(JSON.stringify(options));
    delete optionsMinusToken.headers['Authorization'];
    logger.info(`Making GitHub API request`, url, optionsMinusToken);
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }
    const payload = await response.json();
    const nextPageUrl = response.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || null;
    const nextPage = nextPageUrl ? new URL(nextPageUrl).searchParams.get('page') : null;

    // Extract rate limit headers and store them in database
    const rateLimitHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      if (key.startsWith('x-ratelimit-')) {
        rateLimitHeaders[key] = value;
      }
    }
    await postgrest.rpc('set_gh_rate_limit', {payload: {api_key_id: this.tokenId, headers: rateLimitHeaders}});

    return {response, payload, nextPageUrl, nextPage};

    } catch (error) {
      logger.error(`GitHub API request failed`, error);
    }

  }
}

export default new Github();
