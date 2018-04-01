BasicUIElement = function(env, name, rect){
	var self = {
		name: name,
		type: "ui",
		x: rect.x,
		y: rect.y,
		width: rect.width,
		height: rect.height,
		env: env,
		eventBuffer: [],
		collisionBody: {
			x: 0, y:0,
			width: rect.width, height: rect.height
		}
	};
	self.receive = function(event){
		self.eventBuffer.push(event);
	}
	self.update = function(){
		while(self.eventBuffer.length>0){
			self.eventHandler(self.eventBuffer.shift());
		}
		self.x = rect.x+self.env.camera.x;
		self.y = rect.y+self.env.camera.y;
	}
	self.render = function(){}
	self.eventHandler = function(event){
		if(event.name=="Collision"){
			self.receive(event.target);
		}
	}
	return self;
}

mouse = function(env, name, rect){
	var self = BasicUIElement(env, name, rect);
	self.type="mouse";
	return self;
}

LoginButton = function(env, name, rect, label="button"){
	var self = BasicUIElement(env, name, rect);
	self.target = "username";
	self.text = label;
	self.type = "Button";
	self.render = function(){
		points = [
			{x:self.x, y:self.y},
			{x:self.x+self.width, y:self.y},
			{x:self.x+self.width, y:self.y+self.height},
			{x:self.x, y:self.y+self.height},
			{x:self.x, y:self.y}
		];
		self.env.fillRect(self.x, self.y, self.width, self.height, style="white");
		self.env.drawPolygon(points);
		self.env.fillText(self.text, self.x+0.25*self.width, self.y+0.618*self.height, 0.5*self.height+"px Georgia");
	}
	self.eventHandler = function(event){
		if(event.name=="Collision"){
			self.receive(event.target);
		}
		if(event.name=="onClick"){
			console.log(self.text+" button clicked");
			if(self.env.ui.hasOwnProperty(self.target)){
				self.env.ui[self.target].receive({name: "login"});
			}
		}
	}
	return self;
}

InputBox = function(env, name, rect){
	var self = BasicUIElement(env, name, rect);
	self.type = "InputBox";
	self.upperCase = false;
	self.input = [];
	self.render = function(){
		points = [
			{x:self.x, y:self.y},
			{x:self.x+self.width, y:self.y},
			{x:self.x+self.width, y:self.y+self.height},
			{x:self.x, y:self.y+self.height},
			{x:self.x, y:self.y}
		];
		self.env.fillRect(self.x, self.y, self.width, self.height, style="white");
		self.env.drawPolygon(points);
		if(self.env.inputEventTopic.includes(self.name)){
			self.env.fillText(self.input.join("")+"|", self.x+0.05*self.width, self.y+0.618*self.height, 0.5*self.height+"px Georgia");
		}else{
			self.env.fillText(self.input.join(""), self.x+0.05*self.width, self.y+0.618*self.height, 0.5*self.height+"px Georgia");
		}
	}
	self.eventHandler = function(event){
		if(event.name=="Collision"){
			self.receive(event.target);
		}
		if(event.name=="onClick"){
			self.env.inputEventTopic = [];
			self.env.inputEventTopic.push(self.name);
			if(self.env.ui.hasOwnProperty("message"))
				delete self.env.ui["message"];
		}
		if(event.name=="onKeyDown"){
			if(event.which==13){
				self.receive({name:"login"});
			}
			if(event.which==16){
				self.upperCase=true;
			}
		}
		if(event.name=="onKeyUp"){
			if(event.which==16){
				self.upperCase=false;
			}
			if(event.which==8&&self.input.length>=1)
				self.input.pop();
			if(event.which>=65&&event.which<=90){
				var res = String.fromCharCode(event.which);
				if(!self.upperCase) 
					res = res.toLowerCase();
				if(self.input.length<16)
					self.input.push(res);
			}
		}

		if(event.name=="login"){
			if(self.input.length<3){
				self.env.ui["message"]= TextElement(self.env, "message", {
						x:self.x, y:0, width:100, height:40
					},
					"Player ID \""+ self.input.join("") +"\" is too short",
					style="#FF0000"
				);
				self.env.inputEventTopic = [];
			}else{
				self.env.connect(self.input.join(""));
			}
		}
	}
	return self;
}

ImageElement = function(env, name, rect, image){
	var self = BasicUIElement(env, name, rect);
	self.image = image;
	self.render = function(){
		self.env.drawImage(self, 0,0,self.image.width, self.image.height, self.x, self.y, self.width, self.height);
	}
	return self;
}

TextElement = function(env, name, rect, text, style="#000000"){
	var self = BasicUIElement(env, name, rect);
	self.text = text;
	self.render = function(){
		self.env.fillText(self.text, self.x+0.25*self.width, self.y+0.618*self.height, 0.5*self.height+"px Georgia", style=style);
	}
	return self;
}

GameOver = function(env){
	var self = ImageElement(env, "gameover", {x:100, y:300, width:600, height: 120}, {width: 757, height: 158, source: "/assets/IWBTGTiles/GameOver.png"});
	self.collisionBody = {
		x:-100,y:-300, width:800, height: 800
	}
	self.env.inputEventTopic = ["gameover"];
	self.eventHandler = function(event){
		if(event.name=="Collision"){
			self.receive(event.target);
		}
		if(event.name=="onClick"){
			self.env.inputEventTopic = [];
			self.env.inputEventTopic.push(self.name);
		}
		if(event.name=="onKeyDown"){
			if(event.which==82){
				if(self.env.SavePoint!=null){
					event = {
						name: "trigger",
						target: self.env.SavePoint.name,
						msg: "spawn",
						playerID: self.env.id,
						pos: self.env.SavePoint.savedPos
					}
					self.env.SavePoint.receive(event);
					self.env.serverSocket.emit("clientEvent", event);
					self.env.ui = playingUI(self.env);
				}else{
					loginEvent = {
						name:"Login",
						playerID: self.env.id
					}
					self.env.objects["playerSpawner"].receive(loginEvent);
					self.env.serverSocket.emit("clientEvent", loginEvent);
					self.env.ui = playingUI(self.env);
				}
			}
		}
	}
	return self;
}

LoginUI = function(env){
	//env.inputEventTopic = [];
	return {
		"background": ImageElement(env, "background", {x:0, y:0, width:800, height:800}, {width:800, height:800, source: "/assets/Background/loginScene.png"}),
		"username": InputBox(env, "username", {x:200, y:500, width:300, height: 60}),
		"login": LoginButton(env, "login", {x: 520, y:500,width:130, height:60},"Login"),
		"message": TextElement(env, "message", {x: 200, y: 500, width:100, height:60}, "Player ID",style="#C0C0C0")
	};
}

playingUI = function(env){
	if(env.hasOwnProperty("id"))
		env.inputEventTopic = [env.id];
	return {
	};

}