import { createLogger } from '@ucd-lib/logger';
import config from '../../lib/config.js';

export default createLogger({
  name : config.harvester.logger.name.value,
  level: config.harvester.logger.level.value
});
