import { RouterBase } from "../RouterBase";

class V1 extends RouterBase {
    constructor() {
        super();
        this.setPath("/v1");
    }
}

export default V1;
