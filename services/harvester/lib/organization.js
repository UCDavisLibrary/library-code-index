import logger from './logger.js';
import config from '../../lib/config.js';
import github from './github.js';
import fetch from 'node-fetch';

class Organization {

  async reviewOrg(org, markAsSelected = false) {
    const rpcFunction = markAsSelected ? 'select_queue_item' : 'reject_queue_item';
    const response = await fetch(`${config.postgrest.host.value}/rpc/${rpcFunction}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({payload: org})
    });
    if (!response.ok) {
      throw new Error(`Failed to ${markAsSelected ? 'select' : 'reject'} organization: ${response.statusText}`);
    }
  }

  async getNextOrgInQueue() {
    const params = new URLSearchParams({
      item_type: 'eq.Organization',
      reviewed: 'is.false',
      order: 'created_at.asc',
      limit: '1'
    });
    const response = await fetch(`${config.postgrest.host.value}/selection_queue?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch next organization from queue: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.length === 0) {
      return null;
    }
    return data[0];
  }

  async getQueueCount(query={}) {
    const params = new URLSearchParams({
      item_type: 'eq.Organization',
      ...query
    });

    const response = await fetch(`${config.postgrest.host.value}/selection_queue?${params.toString()}`, {
      method: 'HEAD',
      headers: {
        'Prefer': 'count=exact'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch organization count from queue: ${response.statusText}`);
    }

    const count = response.headers.get('Content-Range');
    if (!count) {
      throw new Error('Count header not found in response');
    }
    const totalCount = parseInt(count.split('/')[1], 10);
    return totalCount;
  }

  async addSearchToQueue(query, options = {}) {
    let limit;
    let perPage = 100;
    if ( options.limit ){
      limit = isNaN(parseInt(options.limit)) ? 100 : parseInt(options.limit);
      perPage = Math.min(limit, 100);
    }
    let nextPage = options.page ? parseInt(options.page) : 1;
    const summary = { success: false, calls: 0, items: 0, skipped: 0, added: 0, lastPage: nextPage };
    try {
      do {
        const result = await github.searchOrgs(query, {
          per_page: perPage,
          page: nextPage
        });
        summary.lastPage = nextPage;
        summary.calls++;
        if (result.payload && result.payload.items) {
          for (const org of result.payload.items) {
            summary.items++;
            // logger.info(`Adding organization to processing queue: ${org.login}`);

            // Add organization to processing queue using postgrest
            const response = await fetch(`${config.postgrest.host.value}/rpc/add_to_selection_queue_if_new`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({payload: org})
            });

            if (!response.ok) {
              throw new Error(`Failed to add organization to queue: ${response.statusText}`);
            }

            const inserted = await response.json();
            if ( inserted ){
              summary.added++;
              // logger.info(`Organization ${org.login} added to processing queue`);
            } else {
              summary.skipped++;
              // logger.info(`Organization ${org.login} already exists in processing queue, skipping`);
            }
          }
        }
        nextPage = result.nextPage;
        logger.info(`Next page: ${nextPage}`);
        if ( limit && summary.items >= limit ) {
          logger.info(`Reached limit of ${limit} items, stopping search`);
          break;
        }
      } while (nextPage);
      logger.info(`Finished searching for organizations with query: ${query}`);
    } catch (error) {
      logger.error(`Error searching for organizations`, error);
      throw error;
    }
    summary.success = true;
    return summary;
  }

}

export default new Organization();
