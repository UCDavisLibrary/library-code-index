import utils from './utils.js';

class Harvest {

  async organization(query, options = {}) {
    utils.processVerboseFlag(options);
    const harvester = (await import('../../harvester/index.js')).default;
    const result = await harvester.models.org.addSearchToQueue(query, options);
    utils.logObject(result);
  }

  async reviewNextOrg(options = {}) {
    utils.processVerboseFlag(options);
    const harvester = (await import('../../harvester/index.js')).default;
    const github = (await import('../../harvester/lib/github.js')).default;
    while (true) {
      const result = await harvester.models.org.getNextOrgInQueue();
      if (!result) {
        console.log('No more organizations in the queue.');
        break;
      }
      const ct = await harvester.models.org.getQueueCount({reviewed: 'is.false'});
      console.log(`Queue Count: ${ct} organizations left to review`);
      try {
        const orgDetails = await github.fetch(result.item.url);
        const simplified = {
          login: orgDetails.payload.login,
          name: orgDetails.payload.name,
          bio: orgDetails.payload.bio,
          blog: orgDetails.payload.blog,
          location: orgDetails.payload.location,
          email: orgDetails.payload.email,
          html_url: orgDetails.payload.html_url
        };
        utils.logObject(simplified);
      } catch (error) {
        utils.logObject(result);
      }

      const selected = await utils.promptYesNo('Add to database and mark as selected?');
      await harvester.models.org.reviewOrg(result, selected);
      console.log(selected ? 'Org Selected' : 'Org Not Selected');
      console.clear();
    }
  }

  async adoptOrgs(options = {}) {
    utils.processVerboseFlag(options);
    const harvester = (await import('../../harvester/index.js')).default;
    const result = await harvester.models.org.adoptOrgs();
  }

}


export default new Harvest();
