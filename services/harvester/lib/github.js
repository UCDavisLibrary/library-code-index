import config from '../../lib/config.js';
import logger from './logger.js';

class Github {
  constructor() {
    this.token = config.github.token;
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

    logger.info(`Making GitHub API request`, url, options);
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }
    const payload = await response.json();
    const nextPageUrl = response.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || null;
    const nextPage = nextPageUrl ? new URL(nextPageUrl).searchParams.get('page') : null;
    return {response, payload, nextPageUrl, nextPage};

    } catch (error) {
      logger.error(`GitHub API request failed`, error);
    }

  }
}

export default new Github();
