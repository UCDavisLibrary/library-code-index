import util from 'util';
import readline from 'readline';

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
}

export default new Utils();
