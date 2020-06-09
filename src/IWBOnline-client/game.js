var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");

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
		toDoNumber = self.eventBuffer.length;
		for(i=0; i<toDoNumber; i++){
			self.controller.eventHandler(self.eventBuffer.shift());
		}
		/*
		if(self.controller==undefined){
			console.log(self.name);
		}*/
		self.controller.update(self);
	}
	self.render = function(){
		self.controller.render(self);
	}
	return self;
}

Game = function(socket){
	var self = {
		frameRate: 60,
		clock: 0,
		initialStage: "InitialStage",
		objects: {}, 
		ui: {},
		globalEventBuffer: [],
		inputEventTopic: [],
		camera: {
			x: 0,
			y: 0,
			width: canvas.width,
			height: canvas.height
		},
		SavePoint: null,
		serverSocket: socket
	}

	self.stageManager = StageManager(self);

	self.receive = function(event){
		self.globalEventBuffer.push(event);
	}
	self.connect = function(id){
		self.serverSocket.on("LoginSuccess", function(data){
			self.id = id;
			self.inputEventTopic.push(self.id);
			self.serverSocket.on("clientEvent", function(event){
				self.receive(event);
			})
			self.serverSocket.on("StageEvent", function(data){
				var event = {
					name: "StageEvent",
					data: data
				}
				self.receive(event);
			})
			self.ui = playingUI(self);
			self.serverSocket.emit("StageEvent", {name: "LoadStage", data: self.initialStage});
		})

		self.serverSocket.on("LoginFailed", function(data){
			self.ui["message"]= TextElement(self, "message", {x:150, y:0,width:100, height:40}, "Login failed: Player ID: "+ id +" already exists", style="#FF0000");
		})
		self.serverSocket.emit("Login", id);
	}
	self.update = function(){
		var t0=performance.now();
		self.clock+=1;
		//console.log("time:"+self.clock/self.frameRate);
		//process event
		toDoNumber = self.globalEventBuffer.length;
		for(i=0; i<toDoNumber; i++){
			self.eventHandler(self.globalEventBuffer.shift());
		}
		var t1=performance.now();
		if(Object.keys(self.objects).length>1)
			collisionDetect(self.objects, {x:0, y:0, width: canvas.width, height: canvas.height});
		var t2=performance.now();

		for(var objectID in self.objects){
			if(self.objects.hasOwnProperty(objectID)){
				self.objects[objectID].update();
			}
		}

		//update camera and stage by player's position
		if(self.objects.hasOwnProperty(self.id)){
			self.camera.x = Math.floor(self.objects[self.id].x/self.camera.width)*self.camera.width;
			self.camera.y = Math.floor(self.objects[self.id].y/self.camera.height)*self.camera.height;
			if(self.clock%30==0)self.stageManager.updateStageByPos({x: self.player.x, y: self.player.y});
		}
		for(var ui_name in self.ui){
			if(self.ui.hasOwnProperty(ui_name))
				self.ui[ui_name].update();
		}

		self.render();
		var t3=performance.now();
		if(self.objects.hasOwnProperty(self.id))
			self.ui["frameRate"]= TextElement(self, "frameRate", {x:750, y:0,width:50, height:20}, "fps: "+ Math.min(60,1000/(t3-t0)));
	}
	self.render = function(){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#87CEFA";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		for(var objectID in self.objects){
			if(self.objects.hasOwnProperty(objectID)){
				var object = self.objects[objectID];
				if(object.hasOwnProperty("width")){
					if(object.x+object.width>=self.camera.x&&object.x<=self.camera.x+self.camera.width
						&&object.y+object.height>=self.camera.y&&object.y<=self.camera.y+self.camera.height)
						object.render();
				}else{
					if(object.x>=self.camera.x&&object.x<=self.camera.x+self.camera.width
						&&object.y>=self.camera.y&&object.y<=self.camera.y+self.camera.height)
						object.render();
				}
			}
		}
		if(self.objects.hasOwnProperty(self.id)){
			self.objects[self.id].render();
		}
		for(var ui_name in self.ui){
			if(self.ui.hasOwnProperty(ui_name))
				self.ui[ui_name].render();
		}
	}
	self.drawImage = function(object, sx, sy, sw, sh, dx, dy, dw, dh){
		if(object.hasOwnProperty("image")){
			if(!object.hasOwnProperty("Image")){
				object.Image = new Image();
				object.Image.src = object.image.source;
			}
			ctx.drawImage(object.Image, sx, sy, sw, sh, dx-self.camera.x, dy-self.camera.y, dw, dh);
		}
	}
	self.fillText = function(text, x, y, font = "20px Georgia", style="#000000"){
		ctx.fillStyle = style;
		ctx.font = font;
		ctx.fillText(text, x-self.camera.x, y-self.camera.y);
		ctx.font = "20px Georgia";
		ctx.fillStyle = "#000000";
	}
	self.fillRect = function(x, y, width, height, style="#000000"){
		ctx.fillStyle = style;
		ctx.fillRect(x-self.camera.x, y-self.camera.y, width, height);
		ctx.fillStyle = "#000000";
	}
	self.drawPolygon = function(points, style = "#000000"){
		ctx.beginPath();
		ctx.moveTo(points[0].x-self.camera.x, points[0].y-self.camera.y);
		for(var i=1; i<points.length; i++){
			ctx.lineTo(points[i].x-self.camera.x, points[i].y-self.camera.y);
		}
		ctx.lineTo(points[0].x-self.camera.x, points[0].y-self.camera.y);
		ctx.lineWidth = 2;
		ctx.strokeStyle = style;
		ctx.stroke();
		ctx.strokeStyle = "#000000";
	}
	self.eventHandler = function(event){
		if(event.name=="StageEvent"){
			self.stageManager.process(event.data);
			if(self.objects.hasOwnProperty(self.id)){
				self.player = self.objects[self.id];
			}
		}
		if(event.name=="onKeyDown"||event.name=="onKeyUp"){
			var data = {
				name: event.name,
				which: event.which
			}
			for(var i=0; i<self.inputEventTopic.length; i++){
				var name = self.inputEventTopic[i];
				if(self.ui.hasOwnProperty(name))
					self.ui[name].receive(event);
				if(self.objects.hasOwnProperty(name))
					self.objects[name].receive(event);
			}
		}
		if(event.name=="onClick"){
			self.inputEventTopic=[];
			if(self.hasOwnProperty("id"))
				self.inputEventTopic.push(self.id);
			var mouseEvent = mouse(self, "onClick", {
				x:self.camera.x+event.x, 
				y:self.camera.y+event.y,
				width: 1,
				height: 1
			})
			self.ui[mouseEvent.name]=mouseEvent;
			collisionDetect(self.ui, {x:0, y:0, width: canvas.width, height: canvas.height});	
			delete self.ui[mouseEvent.name];
		}
		if(event.name=="Login"){
			if(!self.objects.hasOwnProperty(event.playerID)){
				if(self.objects.hasOwnProperty("playerSpawner"))
					self.objects["playerSpawner"].receive(event);
				else
					self.receive(event);
			}
		}
		if(event.name=="disconnect"){
			delete self.objects[event.playerID];
		}

		if(event.name=="UpdatePlayerState"){
			if(self.objects.hasOwnProperty(event.playerID)){
				self.objects[event.playerID].setup(event.data);
			}
		}
		if(event.name=="trigger"){
			if(self.objects.hasOwnProperty(event.target)){
				self.objects[event.target].receive(event);
			}
		}
		if(event.name=="kill"){
			console.log(event.playerID+" is killed");
			if(self.objects.hasOwnProperty(event.playerID)){
				self.objects[event.playerID].receive(event);
			}
			if(event.playerID==self.id){
				self.ui["gameover"] = GameOver(self);
			}
		}
	}
	self.run = function(){
		//Link game api to browser.
		window.addEventListener("keydown", function(event) {
    		// space and arrow keys
    		if([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        		event.preventDefault();
    		}
    		event.name="onKeyDown";
			self.globalEventBuffer.push(event);
		}, false);
		window.addEventListener('keyup', function(event){
        	event.name="onKeyUp";
			self.globalEventBuffer.push(event);
    	},false);
    	canvas.addEventListener('click', function(event){
    		var rect = canvas.getBoundingClientRect();
    		var clickEvent = {
    			name: "onClick",
    			type: "mouse",
    			x: event.clientX - rect.left,
    			y: event.clientY - rect.top
    		};
    		self.globalEventBuffer.push(clickEvent);
    	},false);
    	self.ui=LoginUI(self);
		self.gameLoopID=setInterval(self.update, Math.floor(1000/self.frameRate));
	}
	return self;
}