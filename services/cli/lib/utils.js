import util from 'util';
import readline from 'readline';
import config from '../../lib/config.js';

class Utils {

  logObject(data){
    console.log(util.inspect(data, { showHidden: false, depth: null, colors: true }));
  }

  promptYesNo(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question(question + ' (y/n): ', answer => {
        rl.close();
        resolve(/^y(es)?$/i.test(answer));
      });
    });
  }

  processVerboseFlag(options, noDelete) {
    if (options.verbose) {
      config.harvester.logger.level.value = 'info';
    } else {
      config.harvester.logger.level.value = 'error';
    }
    if (!noDelete) {
      delete options.verbose;
    }
  }
}

export default new Utils();
