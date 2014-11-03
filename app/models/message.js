//app/model/message.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema( {
	key : String,
	execution_time : Number,
	timestamp : Date,
	token : String
})

module.exports = mongoose.model('Message', MessageSchema);