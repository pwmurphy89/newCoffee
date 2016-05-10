var express = require('express');
var router = express.Router();
var mongoUrl = "mongodb://localhost:27017/coffee";
var mongoose = require('mongoose');
mongoose.connect(mongoUrl);

var Account = require('../models/accounts');
var bcrypt = require('bcrypt-nodejs');
var randToken = require('rand-token');
/* GET home page. */

var stripe = require("stripe")(
  "sk_test_MJ2Vm8AM8mdJE2D34qyRgjHf"
);

router.get('/getUserData', function(req,res,next){
	if(req.query.username == undefined){
		res.json({'failure': 'badUser'});
	}else{
		Account.findOne(
			{username: req.query.username},
			function(err,doc){
				if(doc == null){
					res.json({'failure': 'noUser'});
				}else{
					var d = new Date();
					var currentTime = d.getTime();
					var currExpireTime = req.query.expireTime;
					var timeLeft = currExpireTime - currentTime;
					if(timeLeft > 0){
						res.json(doc);
					}else{
						res.json({'failure': 'tokenExpired'})
					}
				}
			}
		);
	}
});

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req,res,next){
	res.render('login', {page: 'login'});
});

router.get('/register', function(req,res,next){
	res.render('register', {page: 'register'});
});

router.get('/options', function(req,res,next){
	res.render('options', {username: req.session.username, page: 'options'});
});

router.get('/delivery', function(req,res,next){
	res.render('delivery', {page: 'delivery'});
});

router.get('/checkout', function(req,res,next){
	res.render('checkout', {page: 'checkout'});
});

router.post('/login', function(req,res,next){
	var username = req.body.username;
	var password = req.body.password;
	var token = randToken.generate(32);
	var date = new Date();
	var expireTime = date.getTime() + 1200000;
	var match = false;

	Account.findOneAndUpdate(
		{username: username},
		{$set:{
			token: token,
			expireTime: expireTime
		}
		},
		function(err, doc){
			if(doc == null){
				res.json({failure:'noUser'});
			}else{
				var passwordsMatch = bcrypt.compareSync(password, doc.password);
				if(passwordsMatch){
					res.json({
						success: 'found',
						token: token,
						expireTime: expireTime
					})
				}else{
					res.json({
						failure: 'badPassword'
					});
				}
			}
		}
	)
});

router.post('/register', function(req,res,next){
	if(req.body.password != req.body.password2){
		res.json({failure:'passwordMatch'});
	}else{
		var token = randToken.generate(32);
		var date = new Date();
		var expireTime = date.getTime() + 1200000;
		var newAccount = new Account({
			username: req.body.username,
			password: bcrypt.hashSync(req.body.password),
			email: req.body.email,
			token: token,
			expireTime: expireTime
		})
		newAccount.save();
		res.json({
			success: 'added',
			token: token,
			expireTime: expireTime
		})
	}
});

router.post('/options',function(req,res,next){
	console.log(req.body.token);
	Account.findOneAndUpdate(
		{token: req.body.token},
		{
		plan: req.body.plan,
		grind: req.body.grind,
		quantity: req.body.quantity,
		frequency: req.body.frequency,
		totalCharge: req.body.totalCharge,
		upsert: true
		},
		function(err, account){
			if(account == null){
				//no response
				res.json({'failure': 'nomatch'});
			}else{
				//we got record and updated it
				res.json({'success': 'update'})
			}
		}
	)
});

router.post('/delivery',function(req,res,next){
	Account.findOneAndUpdate(
		{token: req.body.token},
		{fullName: req.body.fullName,
		address: req.body.address,
		address2: req.body.address2,
		city: req.body.city,
		state: req.body.state,
		zip: req.body.zip,
		deliveryDate: req.body.deliveryDate,
		upsert: true},
		function(err, account){
			if(account == null){
				res.json({'failure': 'nomatch'});
			}else{
				res.json({'success': 'update'})
			}
		}
	)
});


router.post('/checkout',function(req,res,next){
	stripe.charges.create({
	  amount: req.body.amount,
	  currency: "usd",
	  source: req.body.stripeToken, // obtained with Stripe.js
	  description: "Charge for test@example.com"
	}, function(err, charge) {
		res.json({success: 'paid'});
	  console.log("we received the charge");
	});

});
module.exports = router;

