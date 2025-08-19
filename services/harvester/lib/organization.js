import logger from './logger.js';
import config from '../../lib/config.js';
import postgrest from '../../lib/postgrest.js';
import github from './github.js';
import fetch from 'node-fetch';

class Organization {

  async adoptOrgs(){
    logger.info('Adopting organizations from selection queue into the database');
    const orgsInQueue = await postgrest.queryTable('selection_queue', {item_type: 'eq.Organization',selected: 'is.true'});
    logger.info(`Found ${orgsInQueue.length} organizations in selection queue`);

    const r = await github.fetchOrgDetails(orgsInQueue[0].item.login);
    console.log(r);
    for (const org of orgsInQueue) {}
  }

  /**
   * @description Mark an organization as selected or rejected in the selection queue.
   * @param {Object} org - The organization object to be reviewed.
   * @param {Boolean} markAsSelected - If true, mark the organization as selected; otherwise, reject it.
   */
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

  /**
   * @description Get the next organization in the selection queue that has not been reviewed.
   * @returns
   */
  async getNextOrgInQueue() {
    const data = await postgrest.queryTable('selection_queue', {
      item_type: 'eq.Organization',
      reviewed: 'is.false',
      order: 'created_at.asc',
      limit: '1'
    });
    if (data.length === 0) {
      return null;
    }
    return data[0];
  }

  /**
   * @description Get the count of organizations in the selection queue.
   * @param {Object} query - Optional postgrest query parameters to filter the count.
   * @returns
   */
  async getQueueCount(query={}) {
    const params = {
      item_type: 'eq.Organization',
      ...query
    };

    return await postgrest.queryTableCount('selection_queue', params);
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
