# Kafka Log Simulator

This application simulates delivery of log messages to IBM Message Hub using Apache Kafka. It is intended to be used with the solution tutorial [Big data log analytics with Streams and SQL]().

## Usage

```bash
Usage: index --file <file> --parser <name> (--messages | --csv) --broker-list <brokers> --api-key <secret> --topic <name> --rate [speed]

  Options:

    -f, --file [file]               Log file to create messages from
    -p, --parser [parser]           File parser
    -m, --messages [parser]         Stream log messages to Message Hub
    -c, --csv                       Stream log messages to CSV file
    -b, --broker-list [brokerList]  Message Hub brokers list (multiple brokers comma separated)
    -k, --api-key [apiKey]          Message Hub API key
    -t, --topic [topic]             Message Hub topic
    -r, --rate [rate]               Adjusts the message send rate
    -h, --help                      output usage information
```

## Setup

1. Install [node.js](https://nodejs.org/en/).
2. Run `npm install`.
3. Run `npm build`.
4. Follow the below examples commands.

## Examples

Convert an Apache web server log file to CSV.

```sh
node dist/index.js --file /Users/ibmcloud/Downloads/NASA_access_log_Jul95 --parser httpd --csv --out-file /Users/ibmcloud/Downloads/NASA_access_log_Jul95.csv
```

Stream an Apache web server log file to Message Hub.

```sh
node dist/index.js --file /Users/vanstaub/Downloads/NASA_access_log_Jul95 --parser httpd --broker-list "kafka02-prod02.messagehub.services.us-south.bluemix.net:9093" --api-key 0ErVFpnxvRqdfsSDDWQjymc1sdfDF7iRfGsvSv3cp2OOlJ4m --topic webserver --rate 100
```

NASA's sample HTTP web server file [Jul 01 to Jul 31, ASCII format, 20.7 MB gzip compressed](http://ita.ee.lbl.gov/html/contrib/NASA-HTTP.html) can be used to get started.

## Customizing

To read custom log files, do the following.

1. Create a new `/parser/my-parser.ts` file that implements `Parser`.
2. Add the new parser as named export in `Parsers.ts`.
3. Update `getParser()` in `index.ts` to define a new alias for your parser.
4. Run `npm build`.
5. Run `node dist/index.js --parser my-new-parser ...`.
