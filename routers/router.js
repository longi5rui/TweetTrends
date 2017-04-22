var https = require('https');
var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var textParser = bodyParser.text(); // AWS SNS 发来的 POST req 的 content-type 是 plain/text 不是 json, 所以只能用这个
// AWS SNS config
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./awsConfig.json');
var sns = new AWS.SNS();
// AWS ES config
var Elasticsearch = require('aws-es');
var awsESConfig = require('../awsESConfig.json');
var elasticsearch = new Elasticsearch({
    accessKeyId: awsESConfig.accessKeyId,
    secretAccessKey: awsESConfig.secretAccessKey,
    service: 'es',
    region: "us-west-2",
    host: awsESConfig.host
});

router.post('/', textParser, function (req, res) {
	if (req.headers['x-amz-sns-message-type'] == 'SubscriptionConfirmation') {
		console.log("Subscription confirmation message received from AWS SNS =>");

		var bodyObject = JSON.parse(req.body);

		// confirm subcription by access this URL
		https.get(bodyObject.SubscribeURL, function(res) {});
	} else if (req.headers['x-amz-sns-message-type'] == 'Notification') {

		var bodyObject = JSON.parse(req.body);
		var tweet = JSON.parse(bodyObject.Message);

		// Step 1: push to front-end immediately
		req.app.io.emit('point', tweet);

		// Step 2: index to AWS ES
		elasticsearch.index({
		    index: 'twiter',
		    type: 'tweets',
		    body: {
		        user: tweet.user,
            	content: tweet.content,
            	sentiment: tweet.sentiment,
            	lat: tweet.latLng.lat,
            	lng: tweet.latLng.lng
		    }
		}, function(err, data) {
		    if (err) {
		      console.log("Error: fail to index to AWS ES", err);
		    } else {
		      console.log('New tweet has been indexed to AWS ES successfully!');
		    }
		});
	}
});

router.get('/', function (request, response) {
	response.sendFile('index.html', { root: path.join(__dirname, "../public/views/")});
});

module.exports = router;