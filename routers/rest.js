var express = require('express');
var router = express.Router();
var path = require('path');
var filterTweetService = require('../services/filterTweetService');

router.get('/tweetsWithKeyword/:keyword', function (request, response) {
	var keyword = request.params.keyword;

	filterTweetService.getTweetsWithKeyword(keyword, function (tweets) {
		response.json(tweets);
	});
});

module.exports = router;