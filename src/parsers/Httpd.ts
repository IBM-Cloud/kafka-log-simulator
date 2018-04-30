import { Parser, Message } from "../Simulator";

export class HttpdParser implements Parser {
  isValid(text: string) {
    return text.split(' ').length === 10;
  }

  createMessage(text: string): Message {
    const tokens = text.split(' ');
  
    // convert the log record to JSON format
    const body = {
      host: tokens[0],
      timestamp: tokens[3].substring(1),
      request: tokens[6],
      responseCode: parseInt(tokens[8]),
      bytes: parseInt(tokens[9]) 
    }

    const time = body.timestamp.split(':');

    const second = parseInt(time[3]) * 1000;
    const minute = parseInt(time[2]) * 1000 * 60;
    const hour = parseInt(time[1]) * 1000 * 60 * 60;
    const day = (parseInt(time[0].substring(0, 3)) - 1) * 1000 * 60 * 60 * 24;

    // the number of milliseconds in the timestamp (this is not an epoch)
    // used to determine the number of ms between successive log messages
    const milliseconds = day + hour + minute + second;

    return new Message(body, milliseconds);
  }
}
