import organization from "./lib/organization.js";

class Harvester {

  constructor(){
    this.models = {
      org: organization
    }
  }
}

export default new Harvester();
