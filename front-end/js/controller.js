var myApp = angular.module('myApp',['ngRoute', 'ngCookies']);

myApp.config(function($routeProvider, $locationProvider){
	$routeProvider.
	when('/',{
		templateUrl: 'views/front.html',
		controller: 'myController'
	}).when('/register',{
		templateUrl: 'views/register.html',
		controller: 'myController'
	}).when('/options',{
		templateUrl: 'views/options.html',
		controller: 'myController'
	}).when('/login',{
		templateUrl: 'views/login.html',
		controller: 'myController'
	}).when('/delivery',{
		templateUrl: 'views/delivery.html',
		controller: 'myController'
	}).when('/checkout', {
		templateUrl: 'views/checkout.html',
		controller: 'checkoutController'
	}).when('/cancel', {
		templateUrl: 'views/cancel.html',
		controller: 'checkoutController'
	}).when('/about', {
		templateUrl: 'views/about.html',
		controller: 'myController'
	}).when('/thankyou', {
		templateUrl: 'views/thankyou.html',
		controller: 'checkoutController'
	})
});

myApp.controller('myController', function($scope, $http, $location, $cookies, $sce){
	if(($location.path() != '/') && ($location.path() != '/login') && ($location.path() != '/register')){
		$http.get("http://www.pwmurphy.com:3000/getUserData?username=" + $cookies.get('username') + "&expireTime=" + $cookies.get('expireTime'),{
		}).then(function successCallback(response){
			if(response.data.failure == 'noUser' || response.data.failure == 'badUser'){
				$location.path('/login');
			}else if (response.data.failure == 'tokenExpired'){
				timeExpired();
			}else{
				console.log("ok");
				var userOptions = response.data;
				$scope.username = userOptions.username;
			}
		}, function errorCallback(response){
			console.log(response.status);
		});
	}

	 var timeExpired = function(){
		 	$cookies.remove('token');
	        $cookies.remove('username');
	        $cookies.remove('expireTime');
	        $location.path('/');
		 }

	$scope.$watch(function() { 
	       return $location.path(); 
	   },
	   function(param){
         if(param == '/' || param == '/login' || param == '/register'){
           $scope.loggedOut = true;
           $scope.loggedIn = false;
         }else{
         	$scope.loggedOut = false;
         	$scope.loggedIn = true;
         	$scope.username = $cookies.get('username');
         }
     });

	 $scope.logOut = function(){
		$cookies.remove('token');
        $cookies.remove('username');
        $cookies.remove('expireTime');
        $location.path('/');
	 }

	$scope.loginForm = function(){
		$http.post('http://www.pwmurphy.com:3000/login',{
			username: $scope.username,
			password: $scope.password
		}).then(function successCallback(response){

			if(response.data.success == 'found'){
					console.log("cameback");
					console.log(response.data.token);
				$cookies.put('token', response.data.token);
				$cookies.put('username', $scope.username);
				$cookies.put('expireTime', response.data.expireTime);
				$location.path('/options');
			}else if(response.data.failure == 'noUser'){
				$location.path('/register');
				// $scope.errorMessage = 'No such user found';
			}else if(response.data.failure == 'badPassword'){
				$scope.errorMessage = "Please re-type your password.";
			}
		},function errorCallback(response){
			console.log('error');
		})
	};

	$scope.registerForm = function(form){
		if($scope.username==undefined||$scope.password == undefined|| $scope.password2 ==undefined|| $scope.email ==undefined){
			$scope.errorMessage = "Hi! Please make sure to fill out all the inputs.";
		}else{
			$http.post('http://www.pwmurphy.com:3000/register', {
				username: $scope.username,
				password: $scope.password,
				password2: $scope.password2,
				email: $scope.email
			}).then(function successCallback(response){
				if(response.data.failure == 'passwordMatch'){
					$scope.errorMessage = "Hi " +$scope.username+" ! Looks like your passwords \
				don't match.  Please try again.";
				}else if(response.data.success == 'added'){
					$cookies.put('token', response.data.token);
					$cookies.put('username', $scope.username);
					$cookies.put('expireTime', response.data.expireTime);
					$location.path('/options');
				}
			},function errorCallback(response){

			})
		}
	};

	$scope.optionsForm = function(planType){
		var frequency;
		var quantity;
		var totalCharge;
		var thisToken = $cookies.get('token')
		if(planType == 'Individual'){
			frequency = 'Weekly';
			quantity = '14 cups';
			totalCharge = 7;
		}else if(planType == 'Family'){
			frequency = 'Weekly';
			quantity = '40 cups';
			totalCharge = 18;
		}else{
			frequency = $scope.frequency;
			quantity = $scope.quantity + 'lbs';
			totalCharge = (Number($scope.quantity) * 5) + '.00';
		}
		$http.post("http://www.pwmurphy.com:3000/options", {
			token: $cookies.get('token'),
			plan: planType,
			grind: $scope.grind,
			quantity: quantity,
			frequency: frequency,
			totalCharge: totalCharge
		}).then(function successCallback(response){
			if(response.data.success == 'update'){
				$location.path('/delivery');
			}else if( response.data.failure == 'nomatch'){
				$location.path('/login');
			}
		},function errorCallback(response){
			console.log("Error");
			}
		)
	};

	$scope.deliveryForm = function(){
		console.log(typeof($scope.deliveryDate));
		if($scope.fullName == undefined || $scope.address == undefined || $scope.city == undefined || $scope.state == undefined || $scope.zip == undefined){
			$scope.infoMessage = "Please make sure to fill out all fields";
		}else{
			$http.post('http://www.pwmurphy.com:3000/delivery', {
				token: $cookies.get('token'),
				fullName: $scope.fullName,
				address: $scope.address,
				address2: $scope.address2,
				city: $scope.city,
				state: $scope.state,
				zip: $scope.zip,
				deliveryDate: $scope.deliveryDate
			}).then(function successCallback(response){
				if(response.data.failure == 'nomatch'){
					$location.path('/login');
				}else if(response.data.success == 'update'){
					$location.path('/checkout');

				}
				},function errorCallback(response){
					$location.path('/login');
					console.log("Error");
					}
				)
		}
	};

		$(document).ready(function(){
			$("#datepicker").datepicker().on('changeDate', function (ev) {
       			 $scope.deliveryDate= $('#datepicker').val();

       			 $scope.$watch('deliveryDate', function (newValue, oldValue) {
            	 $scope.deliveryDate= newValue;
        		});
  			});
		});
});

myApp.controller('checkoutController', function($scope, $http, $location, $cookies){
	$http.get("http://www.pwmurphy.com:3000/getUserData?username=" + $cookies.get('username') + "&expireTime=" +$cookies.get('expireTime'),{
		}).then(function successCallback(response){
			if(response.data.failure == 'noUser' || response.data.failure == 'badUser'){
				$location.path('/login');
			}else if (response.data.failure == 'tokenExpired'){
				console.log('time expired');
				timeExpired();
			}else{
					var userOptions = response.data;
					$scope.fullName = userOptions.fullName;
					$scope.address = userOptions.address;
					$scope.address2 = userOptions.address2;
					$scope.city = userOptions.city;
					$scope.state = userOptions.state;
					$scope.zip = userOptions.zip;
					$scope.deliveryDate = userOptions.deliveryDate;
					$scope.planType = userOptions.plan;
					$scope.grind = userOptions.grind;
					$scope.quantity = userOptions.quantity;
					$scope.frequency = userOptions.frequency;
					$scope.totalCharge = userOptions.totalCharge;
			}
			}, function errorCallback(response){
				$location.path('/login');
				console.log("ERROR");
			}
		);

	 var timeExpired = function(){
	 	$cookies.remove('token');
	    $cookies.remove('username');
	    $cookies.remove('expireTime');
	    $location.path('/');
 	}

	$scope.$watch(function() { 
	       return $location.path(); 
	   },
	   function(param){
         if(param == '/' || param == '/login' || param == '/register'){
           $scope.loggedOut = true;
           $scope.loggedIn = false;
         }else{
         	$scope.username = $cookies.get('username');
         	$scope.loggedOut = false;
         	$scope.loggedIn = true;
         }
     });

	$scope.paymentForm = function(){
		console.log()
	var handler = StripeCheckout.configure({
	   	key: 'pk_test_ts8osad8adqQf9ihzDwGmxrR',
	   	locale: 'auto',
	   	token: function(token) {
			$http.post("http://www.pwmurphy.com:3000/checkout", {
				amount: $scope.totalCharge * 100,
				stripeToken: token.id					//This will pass amount, stripeToken, and token to /payment
			}).then(function successCallback(response){
				if(response.data.success == 'paid'){
					$location.path('/thankyou');
				}else{
					console.log("error");
				}
				
				//if a response of any kind comes back from /payment, it will foward to /thankYou
				//You can add logic here to determine if the Stripe charge was successful
			}, function errorCallback(response){
			});
	   	}	
	});			
    handler.open({
    	name: 'DC Roasters',
      	description: 'Coffee Masters',
      	amount: $scope.totalCharge * 100
    });		
};

	$scope.cancelForm = function(){
		console.log("CANCEL");
		$location.path('/cancel');
	}

	$(document).ready(function(){
		$("#datepicker").datepicker().on('changeDate', function (ev) {
			$scope.deliveryDate= $('#datepicker').val();

			$scope.$watch('deliveryDate', function (newValue, oldValue) {
	    		$scope.deliveryDate= newValue;
			});
		});
	});

});


