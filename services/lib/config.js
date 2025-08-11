class Config {
  constructor(){

    this.github = {
      token: this._getEnv('GITHUB_TOKEN')
    }

    this.harvester = {
      logger: {
        name: this._getEnv('HARVESTER_LOGGER_NAME', 'lci-harvester'),
        level: this._getEnv('HARVESTER_LOGGER_LEVEL', 'info')
      }
    }

    this.postgrest = {
      host: this._getEnv('POSTGREST_HOST', 'http://postgrest:3000')
    };
  }

  /**
   * @description Get the application configuration object written by the SPA middleware
   * @returns {Object} - Returns the application configuration object.
   */
  get appConfig(){
    if (typeof window !== 'undefined' && window.APP_CONFIG) {
      return window.APP_CONFIG;
    }
    return {};
  }

  /**
   * @description Make the application configuration object written by the SPA middleware
   * @param {Object} config - The configuration object to merge with the default configuration.
   * @returns {Object} - Returns the merged configuration object.
   */
  makeAppConfig(config={}){
    config.title = this.app.title.value;
    config.routes = this.app.routes.value;
    config.logger = {
      logLevel: this.app.logger.logLevel.value
    };
    config[this.postgrest.host.name] = this.postgrest.host.value;
    return config;
  }

  /**
   * @description Get an environment variable and return it as an object with name and value properties.
   * @param  {...any} args - Same as getEnv
   * @returns
   */
  _getEnv(...args) {
    const name = args[0];
    const value = this.getEnv(...args);
    return { name, value };
  }

  /**
   * @description Get an environment variable.  If the variable is not set, return the default value.
   * @param {String} name - The name of the environment variable.
   * @param {*} defaultValue - The default value to return if the environment variable is not set.
   * @param {Boolean|String} errorIfMissing - Throws an error if the environment variable is not set.
   * If true, throws an error in both browser and server environments.
   * If 'browser', throws an error only in the browser.
   * If 'server', throws an error only on the server.
   * @returns
   */
  getEnv(name, defaultValue=null, errorIfMissing=false, parseJson=false) {
    let value;
    if( typeof window !== 'undefined' ) {
      value = window.APP_CONFIG?.[name];
      errorIfMissing = errorIfMissing === true || errorIfMissing === 'browser';
    } else {
      value = process?.env?.[name];
      errorIfMissing = errorIfMissing === true || errorIfMissing === 'server';
    }
    if (value === undefined || value === null) {
      if (errorIfMissing) {
        throw new Error(`Environment variable ${name} is not set`);
      }
      return defaultValue;
    }

    if ( value?.toLowerCase?.() === 'false' ) {
      value = false;
    } else if ( value?.toLowerCase?.() === 'true' ) {
      value = true;
    }
    if (parseJson) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        throw new Error(`Environment variable ${name} is not valid JSON`);
      }
    }
    return value;

  }
}

export default new Config();
