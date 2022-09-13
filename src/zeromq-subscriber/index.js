var EventEmitter = require("events");
var Prom = require("prom-client");
var AMQP = require("amqplib");
var ZLIB = require("zlib");
var zmq = require("zeromq");

class EDDNDecoder extends EventEmitter {
  constructor(eddn_endpoint) {
    super();
    this.zmq_ENDPOINT=eddn_endpoint;    
  }

  streamEvents(endpoint, topic='') {

    var sock = zmq.socket('sub');   // Create a subscriber socket to the endpoint passed into this function

    sock.on('connection', () => { console.log("Stream connected.")});  // Setup the connection event handler functions
    sock.on('disconnect', () => { console.log("Lost connection.")});   // We prob want to handle this cleanly with a reconnect attempt with backoff and die after X retries.

    sock.connect(endpoint);         // Create connection  (usually eddn.edcd.io:9500, may want to setup a debug/test config with a testing emitter with lots of objects.)
    sock.subscribe(topic);          // Subscribe to topic - eddn does not do topic subs so we generally want to subscribe to '' which gets us all relayed events, we must route.

    // Create event handler for when messages comes in.  Everything basically chains off this.
    sock.on('message', this.hnd_zmq_onMessage);

  }


  hnd_zmq_onMessage = function(message) {    
    ZLIB.inflate(message, this.hnd_decompressed_msg)
  }

  hnd_decompressed_msg = function(err, buf) {
    if (err) {
      
    } else {    
      // PRONK SOME JSON NOW.
      this.msg_schema_identify(buf.toString());
    }
  }

  msg_schema_identify = function(eddnJSONMessage) {
    // Attempt to parse JSON
    eddnobj = JSON.parse(eddnJSONMessage); 
    emit('eddnmessage', eddnobj)    
  }
}



function main() {
  
  const ZMQENDPOINT=process.env.ZMQENDPOINT || "tcp://eddn.edcd.io:9500";
  const AMQPENDPOINT=process.env.AMQPENDPOINT || "localhost:9090";
  const AMQPUSERNAME=process.env.RABBITMQ_DEFAULT_USER || "guest";
  const AMQPPASSWORD=process.env.RABBITMQ_DEFAULT_PASS || "guest";
  
  

  //const amqpOpts = { credentials: amqp.credentials.plain(AMQPUSERNAME, AMQPPASSWORD) };

  //var amqpConnection = amqp.connect("amqp://" + AMQPENDPOINT, amqpOpts, (err, connection) => { if (err) { exit(128); } else { console.log("AMQP Connected."); return connection; } })

  var subber = new EDDNDecoder();


  subber.streamEvents(ZMQENDPOINT);
  subber.on('eddnmessage', (data)=>{console.log(data)});

  return 0;
}





if(require.main === module) {
  main();  
}