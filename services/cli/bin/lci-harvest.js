import { Command } from 'commander';
import harvest from '../lib/harvest.js';

const program = new Command();

program
  .command('organization')
  .alias('org')
  .description('Search for github organization(s), and add to processing queue')
  .argument('<query>', 'Search query or organization name')
  .option('-l, --limit <number>', 'Limit number of results')
  .option('-v, --verbose', 'Enable info logging')
  .action(harvest.organization.bind(harvest));

program
  .command('review-next-org')
  .description('Review the next organization in the processing queue')
  .option('-v, --verbose', 'Enable info logging')
  .action(harvest.reviewNextOrg.bind(harvest));

program.parse(process.argv);
