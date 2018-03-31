var express = require('express');
var app = express();
var serv = require('http').Server(app);
var IWBOnlineServ = require('./IWBOnline-server');

app.get('/', function(req, res){
	res.sendFile(__dirname+'/IWBOnline-client/index.html');
})
app.use('/IWBOnline-client', express.static(__dirname+'/IWBOnline-client'));
app.use('/assets', express.static(__dirname+'/assets'));

serv.listen(1096);
console.log("Server Started");

var io = require('socket.io')(serv, {});

var gameServer = IWBOnlineServ.GameServer();
gameServer.connect(io);
gameServer.run();