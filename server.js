/* NodeJS Express API server
*
*
*
*/

//BASE SETUP
var express = require('express'), 
	bodyParser = require('body-parser'),
	Message = require('./app/models/message')
	mongoose = require('mongoose');

var app = express();

var connectMongo = function (){
	mongoose.connect('mongodb://localhost/test', {keepAlive: 1});
	console.log('Connecting to mongodb');
};

mongoose.connection.on('disconnected', connectMongo);
connectMongo();



//configure app to use body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

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
		Message.find().distinct("key", function(err, messages) {
			if(err)
				res.send(err);
			res.json(messages);
		});
	});

//Get all times for a specific key
router.route('/keys/:key_id/time')
	.get(function(req, res)
	{
		Message.find({ key: req.params.key_id}, "execution_time" , function(err, mess)
		{
			if(err)
				res.send(err);

			res.json(mess);
		})
	})
	//Get all times within a specific time range
	.post(function(req, res)
	{
		console.log(req.body.endTime);

		Message.find({ key: req.params.key_id, timestamp: { $gte: req.body.startTime, $lte: req.body.endTime}}, "timestamp", function(err, mess)
		{
			if(err)
				res.send(err);

			res.json(mess);
		})
	});


app.use('/api', router);



//start the server
app.listen(port);
console.log("Server listening on: " + port);
