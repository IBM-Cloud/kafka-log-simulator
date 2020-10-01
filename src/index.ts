import program from 'commander';
import * as Parsers from "./parsers/Parsers";
import { Simulator, Message, Parser } from './Simulator';

program
  .usage('--file <file> --parser <name> (--messages | --csv) --broker-list <brokers> --api-key <secret> --topic <name> --rate [speed]')
  .option('-m, --messages', 'Stream log messages to Event Streams')
  .option('-c, --csv', 'Stream log messages to CSV file')
  .option('-f, --file [file]', 'Input log file')
  .option('-o, --out-file [outFile]', 'Input log file')
  .option('-p, --parser [parser]', 'File parser')
  .option('-b, --broker-list [brokerList]', 'Event Streams brokers list (multiple brokers comma separated)')
  .option('-k, --api-key [apiKey]', 'Event Streams API key')
  .option('-t, --topic [topic]', 'Event Streams topic')
  .option('-r, --rate [rate]', 'Adjusts the message send rate')
  .parse(process.argv);

const parser = getParser(program.parser);

if (program.csv) {
  streamCsv();
} else {
  streamMessages();
}

async function streamCsv() {
  const simulator = new Simulator();
  
  console.log('-- Parsing File --')
  const messages = await simulator.parse(program.file, parser);

  console.log('-- Converting to CSV --')
  simulator.toCsv(program.outFile, messages);
}

async function streamMessages() {
  const simulator = new Simulator({
    'client.id': 'kafka',
    'metadata.broker.list': program.brokerList,
    'security.protocol': 'SASL_SSL',
    'sasl.mechanisms': 'PLAIN',
    'sasl.username': 'token',
    'sasl.password': program.apiKey,
    'dr_cb': true,
    'queue.buffering.max.messages': 2000000
  }, program.rate);

  console.log('-- Connecting to Event Streams --')
  try {
    const connected = await simulator.connect();

    if(connected) {
      console.log('-- Connected --')
      console.log('-- Parsing File --')
      const messages = await simulator.parse(program.file, parser);

      console.log('-- Sending Messages --')
      simulator.sendMessages(messages, program.topic)
    }
  } catch (err) {
    console.log(err);
  }
}

function getParser(name: string): Parser {
  switch(name) {
    case 'httpd':
      return new Parsers.HttpdParser();
    default:
      return new Parsers.DefaultParser();
  }
}
