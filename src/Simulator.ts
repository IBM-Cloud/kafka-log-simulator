import * as fs from 'fs';
import * as Kafka from 'node-rdkafka';
import LineByLineReader from "line-by-line";

export interface Parser {
  /**
   * Determines if a message should be created for a given text input.
   * @param text Text input for a message
   */
  isValid(text: string): boolean;

  /**
   * Converts text input to a suitable message.
   * @param text Text input to convert to message
   */
  createMessage(text: string): Message;
}

export class Message {
  /**
   * Creates a new message.
   * @param body Message body sent to Event Streams
   * @param time Message time in milliseconds; defaults to time this object created if omitted
   */
  constructor(public body: any, public time: number = new Date().getTime()) {

  }
}

export class Simulator {
  encoding: string;
  producer: Kafka.Producer;
  rate: number;

  /**
   * Creates a log file simulator to send messages to Event Streams.
   * @param producerOptions Options for Kafka producer see node-rdkafka
   * @param rate Speed to send messages, calculated by dividing delay by rate
   * @param encoding File encoding, defaults to UTF8
   */
  constructor(producerOptions?: any, rate?: number, encoding?: string) {
    this.rate = rate || 1;
    this.encoding = encoding || 'utf8';

    if (producerOptions) {
      this.producer = new Kafka.Producer(producerOptions, {});
    }
  }

  /**
   * Connects to Event Streams.
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.producer.on('ready', () => resolve(true));
      this.producer.on('event.error', (error) => {
        console.log(`Connection error ${error}`);
        reject(false)
      });
      this.producer.connect({});
    });
  }

  /**
   * Parses a file line by line.
   * @param file File to read
   * @param parser Parsing adapter to use for each line
   */
  parse(file: string, parser: Parser): Promise<Message[]> {
    return new Promise((resolve, reject) => {
      let counter = 1;  // informational counter to track reads
      const messages: Message[] = [];
      const reader = new LineByLineReader(file);

      reader.on('end', () => resolve(messages));

      reader.on('error', error => {
        console.log(`Error parsing ${error}`);
        reject(messages)
      });

      reader.on('line', (text: string) => {
        if (parser.isValid(text)) {
          messages.push(parser.createMessage(text));
        }

        if (counter % 100000 === 0) {
          console.log(`Parsed ${counter} records`);
        }

        counter++;
      });

    }) as Promise<Message[]>;
  }

  /**
   * Sends messages to Event Streams using Kafka producer.
   * @param messages Message list to send to Event Streams
   * @param topic Destination topic for messages
   * @param start Index in message list to begin sending messages
   */
  sendMessages(messages: Message[], topic: string, start?: number) {
    let i = start || 0;

    const sendWithNoDelay = (this.rate == 0);

    do {
      if (i % 10000 === 0) {
        console.log(`Sent ${Math.round(i * 100 / messages.length)}% (${i}/${messages.length})`);
      }

      const body = JSON.stringify(messages[i].body);

      // console.log(`Sending ${body}`);
      this.producer.produce(topic, 0, Buffer.from(body));

      i = i + 1;

      if (!sendWithNoDelay) {
        // re-schedule based on next message's timestamp
        if (messages[i]) {
          const delay = messages[i].time - messages[i - 1].time;
          setTimeout(() => this.sendMessages(messages, topic, i), delay / this.rate);
        }
      }
    } while (messages[i] && sendWithNoDelay)
  }

  /**
   * Converts a list of messages into a CSV file.
   * @param file Output file
   * @param messages Messages to write as CSV
   */
  toCsv(file: string, messages: Message[]) {
    const stream = fs.createWriteStream(file);
    const headers: string[] = Object.keys(messages[0].body);

    stream.write(`${headers.reduce((prev, curr) => `${prev},${curr}`)}\n`);

    messages.forEach((message) => {
      const csv = headers.map(header => message.body[header]).reduce((prev, curr) => `${prev},${curr}`);
      stream.write(`${csv}\n`);
    });
  }
}