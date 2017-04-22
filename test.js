var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.get('/', function (request, response) {
	response.sendFile('index.html', { root: path.join(__dirname, "./public/views/")});
});

var port = process.env.PORT || 3000;

http.listen(port, function(){
	console.log('Server running at http://127.0.0.1:' + port + '/');
});