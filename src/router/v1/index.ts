import CommonApi from "@ireves/common-api";

class V1 extends CommonApi.RouterBase {
  constructor() {
    super();
    this.setPath("/v1");
  }
}

export default V1;
