import { RouterBase } from "common-api-ts";

class V1 extends RouterBase {
    constructor() {
        super();
        this.setPath("/v1");
    }
}

export default V1;
