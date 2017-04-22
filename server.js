// AWS config
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./awsConfig.json');
// AWS SQS config
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
var fifoQueueURL = 'https://sqs.us-west-2.amazonaws.com/269029038110/tweetsQueue.fifo'; // cache for future use
// express config
var express = require('express');
var router = require('./routers/router');
var restRouter = require("./routers/rest");
var app = express();
var http = require('http').Server(app);
// attach socket.io to http server
var io = require('socket.io')(http);
// make io accessable in Router
app.io = io;

app.use('/', router);

app.use('/public', express.static(__dirname + '/public')); // when ask for the static file in public file

app.use('/node_modules', express.static(__dirname + '/node_modules')); // when ask for the static file in node_modules file(chart.js用到)

app.use('/api/v1', restRouter);

/* tweets collection module */
var Twitter = require('ntwitter');
var config = require('./twitterConfig.json');
var twitter = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.token,
    access_token_secret: config.token_secret
});
var languageDetector = require('cld');

// collect data from Twitter Streaming API
twitter.stream('statuses/filter', {'track':'music,trump,nba'}, function(stream) {
    stream.on('data', function (data) {

    	languageDetector.detect(data.text, function(err, result) {
    		if (result !== undefined && result.languages[0].code == 'en' && data.geo != null) {
    			console.log('New tweet ===> ' + data.geo);

    			// construct new tweet object
    			var tweet = {
	            	user: data.user.screen_name,
	            	content: data.text,
	            	latLng: {
	            		lat: data.geo.coordinates[0],
	            		lng: data.geo.coordinates[1]
	            	}
	            };

	            // send to AWS SQS
	            var params = {
	            	MessageAttributes: {},
	            	MessageBody: JSON.stringify(tweet),
	            	MessageGroupId: "tweetsGroup1",
	            	QueueUrl: fifoQueueURL
	            };

	            sqs.sendMessage(params, function(err, data) {
					if (err) {
						console.log("SQS sending error!", err);
					} else {
						console.log("SQS sending success =====> ", data.MessageId);
					}
				});
    		}
    	});

    });
});

var port = process.env.PORT || 3000;

http.listen(port, function(){
  console.log('Server running at http://127.0.0.1:' + port + '/');
});