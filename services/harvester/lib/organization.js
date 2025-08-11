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

  async addSearchToQueue(query, options = {}) {
    const limit = isNaN(parseInt(options.limit)) ? 100 : parseInt(options.limit);
    const perPage = Math.min(limit, 100);
    let nextPage = 1;
    const summary = { success: false, calls: 0, items: 0, skipped: 0, added: 0 };
    try {
      do {
        const result = await github.searchOrgs(query, {
          per_page: perPage,
          page: nextPage
        });
        summary.calls++;
        if (result.payload && result.payload.items) {
          for (const org of result.payload.items) {
            summary.items++;
            logger.info(`Adding organization to processing queue: ${org.login}`);

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
              logger.info(`Organization ${org.login} added to processing queue`);
            } else {
              summary.skipped++;
              logger.info(`Organization ${org.login} already exists in processing queue, skipping`);
            }
          }
        }
        nextPage = result.nextPage;
        if ( summary.items >= limit ) {
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
