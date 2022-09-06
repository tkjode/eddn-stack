if(require.main === module) { 
  main();
}

function main() { 
  const metrics = require("prom-client");

  const ZMQENDPOINT=process.env.ZMQENDPOINT || "tcp://eddn.edcd.io:9500";
  const AMQPENDPOINT=process.env.AMQPENDPOINT || "localhost:9090";

  console.log("Connecting as producer to RabbitMQ...");
  const amqp = require("amqplib");
  var amqpConnection = amqp.connect("amqp://localhost", (err, connection) => { if (err) { exit(128); } else { console.log("AMQP Connected."); return connection; } })

  console.log("ØMQ Subscriber Starting...");
  streamEvents(ZMQENDPOINT);

  

  return 0;
}

function streamEvents(endpoint, topic='') {
  const zmq = require("zeromq");

  console.log("Setting up Connection Handling Chain...");
  console.log("Connecting to: " + endpoint + " on topic: '" + topic+ "'");

  var sock = zmq.socket('sub');   // Create a subscriber socket to the endpoint passed into this function

  sock.on('connection', () => { console.log("Stream connected.")});  // Setup the connection event handler functions
  sock.on('disconnect', () => { console.log("Lost connection.")});   // We prob want to handle this cleanly with a reconnect attempt with backoff and die after X retries.

  sock.connect(endpoint);         // Create connection  (usually eddn.edcd.io:9500, may want to setup a debug/test config with a testing emitter with lots of objects.)
  sock.subscribe(topic);          // Subscribe to topic - eddn does not do topic subs so we generally want to subscribe to '' which gets us all relayed events, we must route.

  // Create event handler for when messages comes in.  Everything basically chains off this.
  sock.on('message', hnd_zmq_onMessage);

  // TODO: Any other event emissions we should properly handle?

}


function hnd_zmq_onMessage(message) {  
  const zlib = require("zlib");
  console.log("ZMQ Raw Message: " + message.toString().length + " bytes received");
  zlib.inflate(message, hnd_decompressed_msg)
}

function hnd_decompressed_msg(err, buf) { 
  if (err) { 
    console.log("ERROR, skipping: " + err);
  } else {
    console.log("Decompressed Message: " + buf.toString().length + " bytes");
    // PRONK SOME JSON NOW.
    msg_schema_identify(buf.toString());
  }
}

function msg_schema_identify(eddnJSONMessage) {
  // Attempt to parse JSON
  eddnobj = JSON.parse(eddnJSONMessage);
  console.log(eddnobj['$schemaRef'] + " // " + eddnobj.message.event);
  return true;
}