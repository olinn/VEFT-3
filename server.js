/* NodeJS Express API server
*
*
*
*/

//BASE SETUP
var express = require('express'), 
	bodyParser = require('body-parser'),
	Message = require('./app/models/message')
	mongoose = require('mongoose'),
	elasticsearch = require("elasticsearch"),
	cors = require('cors');

var app = express();

var connectMongo = function (){
	mongoose.connect('mongodb://localhost/test', {keepAlive: 1});
	console.log('Connecting to mongodb');
};

mongoose.connection.on('disconnected', connectMongo);
connectMongo();

var client = new elasticsearch.Client();

//configure app to use body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

var port = process.env.PORT || 8080;

//Get an instance of express router
var router = express.Router();


//Middleware to use for all requests

router.use(function(req, res, next){
	console.log("Routing in progress");
	next();

})
//Routes
router.get('/', function(req, res)
{
	res.json({message: 'hooray, welcome to our api!'});
	
});

//REAL API calls

//Get all keys
router.route('/keys')
	.get(function(req, res){
		client.search({
			index: 'kodemonkey',
			size: 0,
			body: {
				aggregations: {
					key_list: {
						terms: {
							field: 'key'
						}
					}
				}
			}
		}, function (error, response) {
			if(error){
				// ON ES error, Mongo DB acts as backup
				console.log("An error occured when getting list from ElasticSearch");
				console.log("Error: " + error);
				console.log("Trying to get data from Database...");
				
				Message.find().distinct("key", function(err, messages) {
					if(err)
						res.send("Getting list from database failed: " + err);
					res.json(messages);
					
				});
			}
			else {
				//Take information needed from ES response
				response = response.aggregations.key_list.buckets;
				var filtered = [];
				for(var i = 0; i < Object.keys(response).length; i++) {
					filtered.push(response[i].key);
				}
				res.json(filtered);
			}
		});
	});


//Get all times for a specific key
router.route('/keys/:key_id/time')
	.get(function(req, res) {
		client.search({
			index: 'kodemonkey',
			body: {
				query: {
					query_string: {
						query: req.params.key_id
					}
				}
			}
		}, function (error, response) {
			if(error) {
				// ON ES error, Mongo DB acts as backup
				console.log("An error occured when getting execution times from ElasticSearch");
				console.log("Error: " + req.params.key_id);
				console.log("Trying to get data from Database...");


				Message.find({ key: req.params.key_id}, function(err, mess){
					if(err)
						res.send("Getting execution lists from database failed:" + err);
					var filtered = [];
					for(var i = 0; i < Object.keys(mess).length; i++) {
						console.log(mess);
						filtered.push({"execution_time:":mess[i].execution_time,
										"timestamp":mess[i].timestamp });
					}
					res.json(filtered);
				})
				
			}
			else {
				// Take information needed from ES response
				response = response.hits.hits;
				var filtered = [];
				for(var i = 0; i < Object.keys(response).length; i++) {
					filtered.push({"execution_time":response[i]._source.execution_time,
									"timestamp":response[i]._source.timestamp } );
				}
				res.json(filtered);
			}
		})
	})

	//Get all times within a specific time range

	.post(function(req, res) {
		client.search({
			index: 'kodemonkey',
			body: {
			query : {
				filtered : {
					query: {
						query_string: {
							query : req.params.key_id
							}
						},
						filter: {
							"range" : {
								"timestamp": {
									"gte": req.body.startTime,
									"lte": req.body.endTime
								}
							}
						}
					}
				}
			}
		}, function (error, response) {
			if(error) {
				// ON ES error, Mongo DB acts as backup
				console.log("An error occured when getting execution times from ElasticSearch");
				console.log("Error: " + req.params.key_id);
				console.log("Trying to get data from Database...");


				Message.find({ key: req.params.key_id, timestamp: { $gte: req.body.startTime, $lte: req.body.endTime}}, function(err, mess){
					if(err)
						res.send("Getting execution lists from database failed:" + err);
					var filtered = [];
					for(var i = 0; i < Object.keys(mess).length; i++) {
						filtered.push({"execution_time":mess[i].execution_time,
										"timestamp":mess[i].timestamp });
					}
					res.json(filtered);
				})
				
			}
			else {
				// Take information needed from ES response
				response = response.hits.hits;
				var filtered = [];
				for(var i = 0; i < Object.keys(response).length; i++) {
					filtered.push({"execution_time":response[i]._source.execution_time,
									"timestamp":response[i]._source.timestamp } );
				}
				res.json(filtered);
			} 
		})
	});

/*
{
"startTime":"2014-11-02T21:35:43.000Z",
"endTime":"2014-11-05T21:35:43.000Z"
}
*/

app.use('/api', router);



//start the server
app.listen(port);
console.log("Server listening on: " + port);
