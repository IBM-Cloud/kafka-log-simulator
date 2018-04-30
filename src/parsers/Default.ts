import { Parser, Message } from "../Simulator";

export class DefaultParser implements Parser {
  isValid(text: string) {
    return true;
  }

  createMessage(text: string): Message {
    return new Message(text);
  }
}