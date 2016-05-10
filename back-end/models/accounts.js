var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = new Schema({
	username: String,
	password: String,
	email: String,
	token: String,
	expireTime: Number,
	plan: String,
	grind: String,
	quantity: String,
	frequency: String,
	totalCharge: Number,
	fullName: String,
	address: String,
	address2: String,
	city: String,
	state: String,
	zip: Number,
	deliveryDate: String
});

module.exports = mongoose.model('Account', Account);