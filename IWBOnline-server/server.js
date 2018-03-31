var controllerLib = require('./controllers.js');
var StageManager = require('./StageManager.js');
var fs = require('./fileSys.js');

GameObject = function(env, objectState){
	var self = {
		env: env,
		eventBuffer: []
	};
	self.receive = function(event){
		self.eventBuffer.push(event);
	}
	self.state = function(){
		var state = Object.assign({}, self);
		delete state["env"];
		delete state["receive"];
		delete state["state"];
		delete state["eventBuffer"];
		delete state["controller"];
		delete state["update"];
		return state;
	}
	self.setup = function(state){
		for(var key in state){
			if(state.hasOwnProperty(key)){
				self[key]=state[key];
			}
		}
	}
	//setup
	self.setup(objectState);
	if(self.hasOwnProperty("ControllerName")&&controllerLib.hasOwnProperty(self.ControllerName)){
		self.controller = controllerLib[self.ControllerName](self);
	}else if(controllerLib.hasOwnProperty(self.name+'Controller')){
		self.controller = controllerLib[self.name+'Controller'](self);
	}else{
		self.controller = controllerLib["BasicController"](self);
	}

	//system state traversial function
	self.update = function(){
		while(self.eventBuffer.length>0){
			self.controller.eventHandler(self.eventBuffer.shift());
		}
		self.controller.update(self);
	}
	return self;
}

GameServer = function(){
	var self = {
		frameRate: 60,
		clock: 0,
		sockets: {},
		players: {},
		objects: {},
		globalEventBuffer: [],
	}
	self.stageManager = StageManager(self);

	self.receive=function(event){
		self.globalEventBuffer.push(event);
	}
	self.connect = function(io){
		io.sockets.on('connection', (socket)=>{
			var id = Math.random();
			self.sockets[id]=socket;
			socket.on('Login', function(playerID){
				var event = {
					name: 'Login',
					playerID: playerID,
					socketID: id,
				}
				self.receive(event);
			})
			
			socket.on('disconnect', function(){
				//console.log('disconnect:' + id);
				var event = {
					name: 'disconnect',
					socketID: id
				}
				self.receive(event);
			})

			socket.on('StageEvent', function(data){
				var event = {
					name: 'StageEvent',
					data: data,
					socketID: id
				}
				self.receive(event);
			})

			socket.on('clientEvent', function(data){
				var event = {
					name: 'clientEvent',
					playerID: data.playerID,
					socketID: id,
					data: data
				}
				self.receive(event);
			})
		})
	}

	self.update = function(){
		self.clock+=1;
		//process event
		toDoNumber = self.globalEventBuffer.length;
		for(var i=0; i<toDoNumber; i++){
			self.eventHandler(self.globalEventBuffer.shift());
		}
		for(var objectID in self.objects){
			if(self.objects.hasOwnProperty(objectID)){
				self.objects[objectID].update();
			}
		}
	}
	self.reset = function(){
		self.stageManager.loadStageByName("InitialStage");
		//console.log(self.objects);
	}
	self.eventHandler = function(event){
		//if(event.clock+event.delay>self.clock) return;
		if(event.name=="Login"){
			if(!self.objects.hasOwnProperty(event.playerID)){
				self.sockets[event.socketID].playerID = event.playerID;
				self.objects["playerSpawner"].receive(event); 
				self.receive({
					name: "clientEvent",
					playerID: event.playerID,
					socketID: event.socketID,
					data: {
						name: 'Login',
						playerID: event.playerID
					}
				});
				console.log(event.playerID+" joins the game.");
				self.sockets[event.socketID].emit("LoginSuccess", {});
			}else{
				self.sockets[event.socketID].emit("LoginFailed", {});
			}
		}
		if(event.name=="disconnect"){
			var playerID = self.sockets[event.socketID].playerID;
			delete self.objects[playerID];
			delete self.players[playerID];
			delete self.sockets[event.socketID];
			self.receive({
				name: "clientEvent",
				playerID: playerID,
				socketID: event.socketID,
				data: {
					name: 'disconnect',
					playerID: playerID
				}
			});
			console.log(playerID+" left the game.");
		}
		if(event.name=="StageEvent"){
			event.data.socketID = event.socketID;
			event = event.data;
			self.stageManager.process(event);
			if(event.data=="InitialStage"){
				for(var playerID in self.players){
					self.sockets[event.socketID].emit("clientEvent", {
						name: "Login",
						playerID: playerID
					})
				}
			}
		}
		if(event.name=="clientEvent"){
			//Server's major function: broadcast player's event to all other players.
			for(var id in self.players){
				if(id!=event.playerID&&self.players.hasOwnProperty(id))
					self.players[id].socket.emit(event.name, event.data);
			}
		}
	}
	self.run = function(){
		self.gameLoopID=setInterval(self.update, 1000.0/self.frameRate);
	}
	self.reset();
	return self;

	//compactiable functions
	self.render = function(){
	}
	self.drawImage = function(object, sx, sy, sw, sh, dx, dy, dw, dh){
	}
	self.fillText = function(text, x, y){
	}
	self.drawPolygon = function(points){
	}
}

exports.GameServer = GameServer;