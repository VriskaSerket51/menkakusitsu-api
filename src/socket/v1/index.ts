import { SocketRouterBase } from "../SocketRouterBase";

class V1 extends SocketRouterBase {
    a: number = 0;

    constructor() {
        super();
        this.setPath("/v1");
    }
}

export default V1;
