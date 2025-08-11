#! /usr/bin/env node

import {Command} from 'commander';

const program = new Command();

program
  .name('lci')
  .description('Library Code Index CLI')
  .version('1.0.0')
  .command('harvest', 'Harvest data from various sources for indexing');

program.parse(process.argv);
