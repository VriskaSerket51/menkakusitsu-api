import V1 from "@/router/v1";

class Chat extends V1 {
  constructor() {
    super();
    this.setPath("/chat");
  }
}

export default Chat;
