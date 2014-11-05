/**
 * Each section of the site has its own module. It probably also has
 * submodules, though this boilerplate is too simple to demonstrate it. Within
 * `src/app/home`, however, could exist several additional folders representing
 * additional modules that would then be listed as dependencies of this one.
 * For example, a `note` section could have the submodules `note.create`,
 * `note.delete`, `note.edit`, etc.
 *
 * Regardless, so long as dependencies are managed correctly, the build process
 * will automatically take take of the rest.
 *
 * The dependencies block here is also where component dependencies should be
 * specified, as shown below.
 */
angular.module( 'ngBoilerplate.home', [
  'ui.router',
  'highcharts-ng',
  'plusOne'])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config(function config( $stateProvider ) {
  $stateProvider
  .state('home', {
	url: '/home',
	views: {
		"main": {
			controller: 'HomeCtrl',
			templateUrl: 'home/home.tpl.html'
		}
	},
	data:{ pageTitle: 'Home' }
  })
  .state('keydetail', {
	url: '/home/key',
	views: {
		"main": {
			controller: 'HomeCtrl',
			templateUrl: 'home/home.tpl.html'
		},
		"key": {
			controller: 'HomeCtrl',
			templateUrl: 'home/keydetail.tpl.html'
		}
	},
	data:{ pageTitle: 'Key' }
  });
})

/**
 * And of course we define a controller for our route.
 */
.controller( 'HomeCtrl', function HomeController( $scope, $http) {
	//$scope.selectedKey;
	$scope.startDate = null;
	$scope.endDate = null;
	var lineArray = [10, 15, 12, 8, 7];
	$scope.getKeys = function() {
		$http.get('http://localhost:8080/api/keys').
			success(function(data, status, headers, config) {
				$scope.keys = data;
			}).
			error(function(data, status, headers, config) {
			});
	};

	$scope.getKeys();

	$scope.getKey = function(key) {
		$scope.selectedKey = key;
		$http.get("http://localhost:8080/api/keys/" + key + "/time").
			success(function(data, status, headers, config) {
				$scope.keyDetails = data;
				getChartData(data);
			}).
			error(function(data, status, headers, config) {
			});
	};

	$scope.getdataFromDates = function() {

		if($scope.startDate === null || $scope.endDate === null){
			return $scope.getKey($scope.selectedKey);
		}

		var startDate = formatDate($scope.startDate, "T00:00:00+00:00");
		var endDate = formatDate($scope.endDate, "T23:59:59+00:00");

		$http.post("http://localhost:8080/api/keys/" + $scope.selectedKey + "/time", {"startTime":startDate,"endTime":endDate}).
			success(function(data, status, headers, config) {
				$scope.keyDetails = data;
				getChartData(data);
			}).
			error(function(data, status, headers, config) {
			});
	};

	/* DATE FUNCTIONS */
	$scope.today = function() {
	$scope.dt = new Date();
	};
	$scope.today();

	$scope.clear = function () {
	$scope.startDate = null;
	$scope.endDate = null;
	};


	$scope.toggleMin = function() {
	$scope.minDate = $scope.minDate ? null : new Date();
	};
	$scope.toggleMin();

	$scope.open = function($event) {
	$event.preventDefault();
	$event.stopPropagation();

	$scope.opened = true;
	};

	$scope.dateOptions = {
	formatYear: 'yy',
	startingDay: 1
	};

	$scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate', 'yyyy-MM-dd'];
	$scope.format = $scope.formats[4];

	function formatDate(date, newEnding) {
		var newDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + newEnding;
		return newDate;
	}

	$scope.formatDateShort = function(date) {
		return date.substring(0,10) + " at " + date.substring(11,19);
	};
	
	$scope.resetDates = function(key) {
		$scope.startDate = null;
		$scope.endDate = null;
		$scope.getKey(key);
	};

	function getChartData(data) {
		lineArray.length = 0;
		data.sort(compare);

		data.forEach(function(entry) {
			lineArray.push(entry.execution_time);
		});
	}

	function compare(a,b) {
		if (a.timestamp < b.timestamp)
			return -1;
		if (a.timestamp > b.timestamp)
			return 1;
		return 0;
	}

	/* Highcharts functions */
	$scope.chartConfig = {
		options: {
			chart: {
				type: 'line'
			}
		},
		series: [{
			data: lineArray
		}],
		title: {
			text: 'Execution time'
		},
		xAxis: {
			title: {text: 'execution number'}
		},
		yAxis: {
			title: {text: 'execution time (ms)'}
		},
		loading: false
	} 
})

;
