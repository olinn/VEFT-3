/* NodeJS UDP Server
*
*
*
*/
var dgram = require("dgram"),
	mongo = require("mongoose"),
	server = dgram.createSocket("udp4"),	
	message = require('./app/models/message'),
	elasticsearch = require("elasticsearch");

mongo.connect('mongodb://localhost/test');

var db = mongo.connection;

db.on('error', console.error.bind(console, 'console.error'));

db.once('open', function callback() {
	console.log('DB open');
});

var client = new elasticsearch.Client();

//PRocess message
server.on("message", function(msg, rinfo){
  console.log('got message from client: ' + msg);

  var json = JSON.parse(msg);

  var mess = new message();

  //Change Epoch to correct Date
  var timestampDate = new Date(0);
  timestampDate.setUTCSeconds(json.timestamp);

  mess.key = json.key;
  mess.execution_time = json.execution_time;
  mess.timestamp = timestampDate;
  mess.token = json.token;

  mess.save(function(err, b) { 
  	if(err)
  		console.log('Error saving');
  	else
  		console.log("Data saved");
  

	client.index({
		index: 'kodemonkey',
		type: 'mytype',
		id: String(b._id),
		body: mess
		}, function (error, response) {

	});
	})

});


server.on('listening', function(){
  console.log('Kodemon server listening on')
  console.log('hostname: ' + server.address().address);
  console.log('port: ' + server.address().port);
});

server.bind(4000)

