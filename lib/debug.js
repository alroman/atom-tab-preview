'use strict';

const net = require('net');
const log = require('console');
const Protocol = require('_debugger').Protocol;
const spawn = require('child_process').spawn;
const protocol = new Protocol();

protocol.onResponse = message => {
  console.log(JSON.stringify(message.body, null, 2));
};

const script = spawn('node', [
  '--debug-brk',
  'test.js'
]);

script.stdout.on('data', (data) => {
  console.log(`${data}`);
});

script.stderr.on('data', (data) => {
  console.log(`${data}`);
});

script.on('exit', (code) => {
  console.log(`Child exited with code ${code}`);
});

function connect() {

  var client = new net.createConnection(5858)
    .on('connect', () => {

      var msg = JSON.stringify({
        seq: 1,
        type: 'request',
        command: 'continue'
      });
      var header = 'Content-Length: ' + Buffer.byteLength(msg, 'utf-8');

      client.write(header + '\r\n\r\n' + msg);
      log.log('connected');

    })
    .on('data', protocol.execute.bind(protocol))
    .on('error', () => {
      log.log('Connection error');
      setTimeout(function() {
        log.log('Retry');
        connect();
      }, 1000);
    })
    .on('end', () => {
      log.log('Connection ended');
    })
    .on('close', () => {
      log.log('Connection closed');
    })
    .setEncoding('utf8');

  return client;
}

connect();
