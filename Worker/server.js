// AWS config
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./awsConfig.json');
// AWS SQS config
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
var fifoQueueURL = 'https://sqs.us-west-2.amazonaws.com/269029038110/tweetsQueue.fifo';
// AWS SNS config
var sns = new AWS.SNS();
// IBM waston config
var wastonConfig = require('./wastonConfig.json');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': wastonConfig.username,
  'password': wastonConfig.password,
  'version_date': '2017-02-27'
});

var params = {
	AttributeNames: [
	"SentTimestamp"
	],
	MaxNumberOfMessages: 1,
	MessageAttributeNames: [
	"All"
	],
	QueueUrl: fifoQueueURL,
	VisibilityTimeout: 30,
	WaitTimeSeconds: 20
};

// keep retrieving message from AWS SQS
setInterval(function () {

	sqs.receiveMessage(params, function(err, data) {
		if (err) {
			console.log("Error: SQS message receiving error", err);
		} else if (data.Messages != undefined) {

			// tweet process: examine the sentiment
			var tweet = JSON.parse(data.Messages[0].Body);

			var parameters = {
				'text': tweet.content,
				'features': {
					'sentiment': {}
				}
			};

			natural_language_understanding.analyze(parameters, function(err, response) {
				
				if (err) {
					console.log('Error: IBM waston NLP error', err);

					// if error, we also need to delete the message from AWS SNS or we are blocked here
					var deleteParams = {
						QueueUrl: fifoQueueURL,
						ReceiptHandle: data.Messages[0].ReceiptHandle
					};

					sqs.deleteMessage(deleteParams, function(err, data) {
						if (err) {
							console.log("Error: SQS message deleting", err);
						} else {
							console.log("Message Deleted from SQS", data);
						}
					});

					return;

				} else {
					tweet.sentiment = response.sentiment.document.label;

					// Step 1: Publish to AWS SNS
					var snsParams = {  
						TopicArn: "arn:aws:sns:us-west-2:269029038110:twitterChannel",
						Message: JSON.stringify(tweet)
					};

					sns.publish(snsParams, function(err, res) {
						if (err) {
							console.log(err.stack);
							return;
						}
						console.log("SNS: Message Published!");
					});

					// Step 2: Delete message from SQS after processing
					var deleteParams = {
						QueueUrl: fifoQueueURL,
						ReceiptHandle: data.Messages[0].ReceiptHandle
					};

					sqs.deleteMessage(deleteParams, function(err, data) {
						if (err) {
							console.log("Error: SQS message deleting", err);
						} else {
							console.log("Message Deleted from SQS", data);
						}
					});
				}
			});
		}
	});
}, 2000); // retrieve message from AWS SQS every 2s