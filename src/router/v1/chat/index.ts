import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";

class Chat extends V1 {
    constructor() {
        super();
        this.setPath("/chat");
    }
}

export default Chat;
