BasicController = function(owner){
	var self = {
		owner: owner
	}
	self.update = function(owner){}
	self.eventHandler = function(event){}
	self.render = function(owner){}
	return self;
}

BackgroundController = function(owner){
	var self = BasicController(owner);
	//self.drawn = false;

	self.render = function(owner){
		//console.log("drawBackground");
		self.owner.env.drawImage(self.owner, 0,0,800,800,owner.x, owner.y,800,800);
	}
	return self;
}

PhysicsController = function(owner){
	var self = BasicController(owner);
	owner.type = "physical";
	self.g = 0.5;
	self.onFloor = false;
	self.justCollided = false;
	self.update = function(owner){
		owner.x+=owner.vx;
		owner.y+=owner.vy;
		if(owner.vy!=0&&!self.justCollided){
			self.onFloor = false;
		}
		if(self.justCollided){
			self.justCollided=false;
		}
		owner.vy += self.g;
	}
	self.eventHandler = function(event){
		if(event.name=="Collision"){
			var target = event.target;
			if(target.type=="floor"){
				if(!testPolygonOverlap(owner, target)) return;
				self.justCollided = true;
				var rect1 = {
					x1: owner.x+owner.collisionBody.x, 
					y1: owner.y+owner.collisionBody.y,
					x2: owner.x+owner.collisionBody.x+owner.collisionBody.width,
					y2: owner.y+owner.collisionBody.y+owner.collisionBody.height
				};
				var rect2 = {
					x1: target.x+target.collisionBody.x, 
					y1: target.y+target.collisionBody.y,
					x2: target.x+target.collisionBody.x+target.collisionBody.width,
					y2: target.y+target.collisionBody.y+target.collisionBody.height
				};
				var dist_x = (rect1.x1<rect2.x1)? rect2.x1-rect1.x2: rect1.x1-rect2.x2;
				var dist_y = (rect1.y1<rect2.y1)? rect2.y1-rect1.y2: rect1.y1-rect2.y2;

				if(dist_y>=0){
					if(rect1.y1<rect2.y1){
						//hit floor
						self.onFloor=true;
						owner.vy = dist_y;
					}else{
						//hit celling
						owner.vy = -dist_y;
					}
				}else if(dist_x>=0){
					if(rect1.x1<rect2.x1){
						//hit right wall
						owner.vx = dist_x;
					}else{
						//hti left wall
						owner.vx = -dist_x;
					}
				}
			}
		}
	}
	return self;
}

PlayerController = function(owner){
	var self = BasicController(owner);
	//animation system
	self.image = {source: "/assets/IWBTGTiles/Kid.png"};
	self.size = 25;
	self.aniClock = 0;
	self.frameRate = 10;
	self.clockRate = Math.ceil(owner.env.frameRate/self.frameRate);
	self.pose = {
		idle: [{x:25, y:24}, {x:52, y:24},{x:80,y:24},{x:107, y:24}],
		walking: [{x:26, y:50},{x:56, y:50},{x:84, y:50},{x:112, y:50},{x:143,y:50}],
		jumping: [{x:24, y:93},{x:48, y:93}],
		falling: [{x:29, y:123},{x:58, y:123}],
		sliding: [{x:35, y:154},{x:75, y:155}]
	}
	//physcis
	self.g = 0.5;

	//character state flags
	self.enableDoubleJump = false;
	self.onFloor = false;
	self.justCollided = false;
	self.tryJump = false;
	if(self.owner.name==self.owner.env.id){
		//only main player has sound effect
		self.audio = {
			"jump_1": new Audio("/assets/sounds/jump_1.wav"),
			'jump_2': new Audio("/assets/sounds/jump_2.wav"),
		}
		for(var name in self.audio){
			self.audio[name].preload = 'auto';
			self.audio[name].load();
		}
	}

	self.update = function(player){
		player.x+=owner.vx;
		player.y=player.y+owner.vy;
		if(self.owner.name==self.owner.env.id){
			if(owner.jump&&(self.onFloor||self.enableDoubleJump)){
				if(self.onFloor){
					if(self.audio["jump_1"].readyState==4){
						if(self.audio["jump_1"].currentTime==0 || self.audio["jump_1"].ended){
							self.audio["jump_1"].play();
						}
					}
				}else{
					if(self.audio["jump_2"].readyState==4){
						if(self.audio["jump_2"].currentTime==0 || self.audio["jump_2"].ended){
							self.audio["jump_2"].play();
						}
					}
				}
			}
		}
		if(owner.moveLeft) owner.vx = -owner.speed;
		else if(owner.moveRight) owner.vx = owner.speed;
		else{
			owner.vx = 0;
		}
		if(self.onFloor){
			self.enableDoubleJump = true;
			//self.onFloor = false;
		}
		if(owner.jump&&(self.onFloor||self.enableDoubleJump)){
			owner.vy = -2.0*owner.speed;
			owner.jump = false;
			if(self.onFloor) self.enableDoubleJump = true;
			else self.enableDoubleJump = false;
		}
		if(owner.vy!=0&&!self.justCollided){
			self.onFloor = false;
		}
		if(self.justCollided){
			self.justCollided=false;
		}
		if(owner.vy+self.g<10){
			if(self.tryJump&&owner.vy<0){
				owner.vy += 0.5*self.g;
			}else{
				owner.vy += self.g;
			}
		}
	}
	self.render = function(player){ 
		var tic=self.aniClock,sx=0,sy=0,sw=-self.size,sh=-self.size,dx=player.x,dy=player.y,dw=-self.size,dh=-self.size;
		var pose = self.pose;
		if(owner.vx!=0||(owner.vy!=0&&!self.onFloor)){
			if(owner.vy==0||self.onFloor){
				tic %= pose.walking.length;
				sx=pose.walking[tic].x; sy=pose.walking[tic].y;
			}else if(owner.vy<0){
				tic %= pose.jumping.length;
				sx=pose.jumping[tic].x; sy=pose.jumping[tic].y;
			}else{
				tic %= pose.falling.length;
				sx=pose.falling[tic].x; sy=pose.falling[tic].y;
			}
		}else{
			tic %= pose.idle.length;
			sx=pose.idle[tic].x; sy=pose.idle[tic].y
		}
		if(!owner.isFacingRight){
			sx = 348-sx;
			sw = -sw;
		}
		self.owner.env.drawImage(self, sx, sy, sw, sh, dx, dy, dw, dh);
		self.owner.env.fillText(player.name, dx+dw, dy+dh);
		self.aniClock+=((player.env.clock%self.clockRate)==0);
		/*debug show collisionBody
		if(owner.collisionBody.hasOwnProperty("points")){
			var points = owner.collisionBody.points.map(p=>{
				return {x: self.owner.x+p.x, y: self.owner.y+p.y}});
			self.owner.env.drawPolygon(points);
		}
		*/
	}
	self.collisionHandler = function(target){
		//console.log("About collide with "+target.name)
		if(target.type=="floor"){
			if(!testPolygonOverlap(owner, target)) return;
			self.justCollided=true;
			var rect1 = {
				x1: owner.x+owner.collisionBody.x, 
				y1: owner.y+owner.collisionBody.y,
				x2: owner.x+owner.collisionBody.x+owner.collisionBody.width,
				y2: owner.y+owner.collisionBody.y+owner.collisionBody.height
			};
			var rect2 = {
				x1: target.x+target.collisionBody.x, 
				y1: target.y+target.collisionBody.y,
				x2: target.x+target.collisionBody.x+target.collisionBody.width,
				y2: target.y+target.collisionBody.y+target.collisionBody.height
			};
			var dist_x = (rect1.x1<rect2.x1)? rect2.x1-rect1.x2: rect1.x1-rect2.x2;
			var dist_y = (rect1.y1<rect2.y1)? rect2.y1-rect1.y2: rect1.y1-rect2.y2;

			if(dist_y>=-5){
				if(rect1.y1<rect2.y1){
					//hit floor
					self.onFloor=true;
					owner.vy = dist_y;
				}else{
					//hit celling
					owner.vy = -dist_y;
				}
			}else if(dist_x>=-5){
				if(rect1.x1<rect2.x1){
					//hit right wall
					owner.vx = dist_x;
				}else{
					//hti left wall
					owner.vx = -dist_x;
				}
			}
		}
		if(target.type=="trap"){
			if(self.owner.name!=self.owner.env.id) return;
			var killEvent = {
				name: "kill",
				playerID: owner.env.id
			}
			owner.env.receive(killEvent);
			owner.env.serverSocket.emit("clientEvent", killEvent);
		}
	}
	self.eventHandler = function(event){
		if(event.name=="onKeyDown"){
			switch(event.which){
				case 37://left
					owner.isFacingRight=false;
					owner.moveLeft=true;
					break;
				case 38://up
					owner.jump=true;
					self.tryJump=true;
					break;
				case 39://right
					owner.isFacingRight=true;
					owner.moveRight=true;
					break;
				case 40://down
					//owner.vy=owner.speed;
					break;
			}
			self.aniClock=0;
			owner.env.serverSocket.emit("clientEvent", {
				name: "UpdatePlayerState",
				playerID: owner.env.id,
				data: owner.state()
			})
		}
		if(event.name=="onKeyUp"){
			switch(event.which){
				case 37://left
					owner.moveLeft=false;
					break;
				case 38://up
					owner.jump=false;
					self.tryJump=false;
					break;
				case 39://right
					owner.moveRight=false;
					break;
				case 40://down
					//owner.vy=0;
					break;
				case 27:
					var killEvent = {
						name: "kill",
						playerID: owner.env.id
					};
					owner.env.receive(killEvent);
					owner.env.serverSocket.emit("clientEvent", killEvent);
					break;
			}
			self.aniClock=0;
			owner.env.serverSocket.emit("clientEvent", {
				name: "UpdatePlayerState",
				playerID: owner.env.id,
				data: owner.state()
			})
		}
		if(event.name=="kill"){
			owner.env.objects[self.owner.name+"_dead"]=GameObject(
				owner.env, {
					name: self.owner.name+"_dead",
					x:owner.x, y:owner.y,
					ControllerName: "PlayerExplosionController"
				}
			);
			if(self.owner.env.objects.hasOwnProperty(event.playerID)){
				delete self.owner.env.objects[event.playerID];
			}
		}
		if(event.name=="Collision"){
			self.collisionHandler(event.target);
		}
	}
	return self;
}

ParticleController = function(owner){
	var self = PhysicsController(owner);
	if(owner.hasOwnProperty("color"))
		self.color = owner.color;
	else
		self.color = "#FF0000";
	self.render = function(owner){
		owner.env.fillRect(owner.x, owner.y, 4, 4, style=self.color);
	}
	return self;
}

PlayerExplosionController = function(owner){
	var self = BasicController(owner);
	self.image = {source: "/assets/IWBTGTiles/Kid.png"};
	self.audio = new Audio("/assets/sounds/death.wav");
	self.audio.preload = 'auto';
	self.audio.load();
	self.size = 25;
	self.lifeSpan = 10;
	self.aniClock = 0;
	self.frameRate = 10;
	self.pose = [{x:25, y:24}, {x:52, y:24},{x:80,y:24},{x:107, y:24}];
	self.loop = false;

	self.clockRate = Math.ceil(owner.env.frameRate/self.frameRate);

	self.parts = [];
	for(var i=0; i<20; i++){
		owner.env.objects[self.owner.name+"_"+i] = GameObject(
			owner.env, {
				name: self.owner.name+"_"+i,
				x:owner.x, y:owner.y,
				vx: 5*Math.random()-2.5,
				vy: -20*Math.random()+2.5,
				collisionBody: {x: 0, y:0, width:5, height:5},
				ControllerName: "ParticleController",
				color: "#FF0000"
			}
		);
		self.parts.push(self.owner.name+"_"+i);
	}
	self.update = function(owner){
		if(self.aniClock>self.lifeSpan){
			for(var i=0; i<self.parts.length; i++){
				delete self.owner.env.objects[self.parts[i]];
			}
			delete self.owner.env.objects[self.owner.name];
		}
		if(self.audio.readyState==4){
			if(self.audio.currentTime==0 || (self.loop==true && self.audio.ended)) {
				self.audio.play();
			}
		}
	}
	self.render = function(owner){
		/*
		var tic=self.aniClock,sx=0,sy=0,sw=-self.size,sh=-self.size,dx=owner.x,dy=owner.y,dw=-self.size,dh=-self.size;

		if(self.loop){
			tic%=self.pose.length;
		}
		if(tic<self.pose.length){
			sx=self.pose[tic].x; sy=self.pose[tic].y;
			self.owner.env.drawImage(self, sx, sy, sw, sh, dx, dy, dw, dh);
		}
		*/
		self.aniClock+=((owner.env.clock%self.clockRate)==0);
	}
	return self;
}


PlayerSpawner = function(owner){
	self = BasicController(owner);
	self.eventHandler = function(event){
		if(event.name=="Login"){
			//console.log("Player: "+event.playerID+" joined");
			owner.env.objects[event.playerID]=GameObject(
				owner.env, {
					name: event.playerID,
					x:owner.x, y:owner.y,
					speed: 3,
					ControllerName: "PlayerController",
					collisionBody: {x: -21, y:-21, width:18, height:21},
					vx: 0, vy: 0,
					ax: 0, ay: 0,
					isFacingRight: true,
					moveLeft: false,
					moveRight: false,
					jump: false
				}
			);
			if(event.playerID==self.owner.env.id)
				self.owner.env.player=owner.env.objects[event.playerID];
		}
	}
	return self;
}


TileController = function(owner){
	var self = BasicController(owner);
	self.iniX = owner.x;
	self.iniY = owner.y;
	self.moveToX = self.iniX;
	self.moveToY = self.iniY;
	self.vx=0;
	self.vy=0;
	self.state = "null";
	self.aniClock = 0;
	self.hide = false;
	self.collisionBody = owner.collisionBody;
	self.update = function(owner){
		if(self.aniClock<0) return;
		if(self.state=="move"){
			if(self.aniClock<=1){
				self.state="null";
				self.vx=0;
				self.vy=0;
			}else{
				owner.x+=self.vx;
				owner.y+=self.vy;
			}
		}
		if(self.state=="moveTo"){
			owner.x+=(self.moveToX-owner.x)/self.aniClock;
			owner.y+=(self.moveToY-owner.y)/self.aniClock;
			if(self.aniClock<=1){
				owner.x = self.moveToX;
				owner.y = self.moveToY;
				self.state = "null";
			}
		}
		if(self.state=="reset"){
			owner.x+=(self.iniX-owner.x)/self.aniClock;
			owner.y+=(self.iniY-owner.y)/self.aniClock;
			if(self.aniClock<=1){
				owner.x = self.iniX;
				owner.y = self.iniY;
				self.state = "null";
			}
		}
		self.aniClock-=1;
	}
	self.render = function(owner){
		if(!self.hide) self.owner.env.drawImage(self.owner, 0,0,32,32, self.owner.x, self.owner.y, owner.width, owner.height);
		/*debug show collisionBody 
		if(owner.hasOwnProperty("collisionBody")&&self.owner.collisionBody.hasOwnProperty("points")){
			var points = owner.collisionBody.points.map(p=>{
				return {x: self.owner.x+p.x, y: self.owner.y+p.y}});
			self.owner.env.drawPolygon(points, style = "#FF0000");
		}
		*/
	}
	self.eventHandler = function(event){
		if(event.name == "trigger"){
			command = event.msg.split(" ");
			if(self.hasOwnProperty("audio")&&command[0]!="reset"&&command[0]!="appear"){
				if(self.audio.readyState==4){
					if(self.audio.currentTime==0 || self.audio.ended){
						self.audio.play();
					}
				}
			}
			if(command[0]=="move"){
				self.state = "move";
				self.vx += Number(command[1]);
				self.vy += Number(command[2]);
				self.aniClock = Number(command[3]);
			}
			if(command[0]=="moveTo"){
				self.state="moveTo";
				self.aniClock = Number(command[3]);
				self.moveToX = self.iniX+Number(command[1]);
				self.moveToY = self.iniY+Number(command[2]);
			}
			if(command[0]=="reset"){
				/*
				if(self.state!="null"){
					self.owner.receive(event);
					return;
				}
				*/
				self.state = "reset";
				self.aniClock = command[1];
			}
			if(command[0]=="hide"){
				console.log("hide");
				self.hide=true;
				delete self.owner.collisionBody;
			}
			if(command[0]=="appear"){
				self.hide=false;
				self.owner.collisionBody = self.collisionBody;
			}
			if(command[0]=="reshape"){
				if(self.hasOwnProperty("reshape")){
					width = Number(command[1]);
					height = Number(command[2]);
					self.reshape(width, height);
				}
			}
		}
	}
	return self;
}

SavePoint = function(owner){
	var self = TileController(owner);
	self.eventHandler = function(event){
		if(event.name=="Collision"){
			if(event.target.name!=self.owner.env.id) return;
			self.owner.savedPos = {x: event.target.x, y:event.target.y};
			if(self.owner.env.SavePoint==null){
				self.owner.receive({name: "trigger", msg: "setup"});
			}else if(self.owner.env.SavePoint.name!=self.owner.name){
				self.owner.env.SavePoint.receive({name: "trigger", msg: "unset"});
				self.owner.receive({name: "trigger", msg: "setup"});
			}
		}
		if(event.name=="trigger"){
			if(event.msg=="setup"){
				self.owner.env.SavePoint=self.owner;
				self.owner.image.source = "/assets/IWBTGTiles/IWBTGsave2.png";
				if(self.owner.hasOwnProperty("Image")){
					delete self.owner.Image;
				}
			}
			if(event.msg=="unset"){
				if(self.owner.env.SavePoint!=null&&self.owner.env.SavePoint.name==self.owner.name)
					self.owner.env.SavePoint=null;
				self.owner.image.source = "/assets/IWBTGTiles/IWBTGsave1.png";
				if(self.owner.hasOwnProperty("Image")){
					delete self.owner.Image;
				}
			}
			if(event.msg=="spawn"){
				self.owner.env.objects[event.playerID]=GameObject(
					owner.env, {
						name: event.playerID,
						x:event.pos.x, y:event.pos.y,
						speed: 3,
						ControllerName: "PlayerController",
						collisionBody: {x: -21, y:-21, width:18, height:21},
						vx: 0, vy: 0,
						ax: 0, ay: 0,
						isFacingRight: true,
						moveLeft: false,
						moveRight: false,
						jump: false
					}
				);
				if(event.playerID==self.owner.env.id)
					self.owner.env.player = self.owner.env.objects[event.playerID];
			}
		}
	}
	return self;
}

WussController = function(owner){
	var self = TileController(owner);
	self.eventHandler = function(event){
		if(event.name=="trigger"){
			if(event.msg=="setup"){
				self.owner.image.source = "/assets/IWBTGTiles/IWBTGwuss1.png";
				if(self.owner.hasOwnProperty("Image")){
					delete self.owner.Image;
				}
			}
			if(event.msg=="unset"){
				self.owner.image.source = "/assets/IWBTGTiles/IWBTGwuss2.png";
				if(self.owner.hasOwnProperty("Image")){
					delete self.owner.Image;
				}
			}
		}
	}
	return self;
}

nailController = function(owner){
	var self = TileController(owner);
	owner.type = "trap";
	self.reshape = function(width, height){
		owner.width = width;
		owner.height = height;
		if(owner.hasOwnProperty("collisionBody")){
			if(owner.collisionBody.hasOwnProperty("points")){
				owner.collisionBody.points[2] = {
					x: width, y: height/2
				}
			}
		}
	}
	self.audio = new Audio("/assets/sounds/electric_motor_opening.wav");
	self.audio.preload = 'auto';
	self.audio.load();
	return self;
}

TriggerController = function(owner){
	var self = BasicController(owner);
	self.targets = [];
	self.message = [];
	self.coolingTime = 0;
	self.coolingClock = -1;
	self.activated = true;
	self.resetTime = 60;
	self.update = function(owner){
		if(self.coolingClock < 0)
			return;
		if(self.coolingClock == 0){
			for(var i=0; i<self.targets.length; i++){
				var target = self.targets[i];
				var event1 = {
					name: "trigger",
					target: target,
					msg: "reset "+self.resetTime
				};
				var event2 = {
					name: "trigger",
					target: target,
					msg: "appear"
				};
				self.owner.env.objects[target].receive(event1);
				self.owner.env.serverSocket.emit("clientEvent", event1);
				self.owner.env.objects[target].receive(event2);
				self.owner.env.serverSocket.emit("clientEvent", event2);
			}
		}
		self.coolingClock -=1;
	}
	self.eventHandler = function(event){
		if(event.name=="trigger"){
			if(event.msg=="activate"){
				self.activated = true;
			}
			if(event.msg=="deactivate"){
				self.activated = false;
			}
		}
		if(!self.activated) return;
		if(self.coolingClock > 0) return;
		if(event.name=="Collision"){
			if(event.target.name!=self.owner.env.id) return;
			for(var i=0; i<self.targets.length;i++){
				var target = self.targets[i];
				if(self.owner.env.objects.hasOwnProperty(target)){
					event = {
						name: "trigger",
						target: target,
						msg: self.message[i]
					}
					self.owner.env.objects[target].receive(event);
					self.owner.env.serverSocket.emit("clientEvent", event);
				}
			}
			self.coolingClock = self.coolingTime;
		}
	}
	return self;
}


stage1_trigger_1 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage1-Tile-6.13"];
	self.message = ["move 0 2 30"];
	self.coolingTime = 31;
	self.resetTime = 60;
	return self;
}

stage1_trigger_2 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage1-Tile-12.13"];
	self.message = ["move 0 2 30"];
	self.coolingTime = 31;
	self.resetTime = 60;
	return self;
}

stage1_trigger_3 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage1-Tile-18.13"];
	self.message = ["move 0 2 30"];
	self.coolingTime = 31;
	self.resetTime = 60;
	return self;
}

stage2_trigger_1 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage2_trigger_3", "stage2-Tile-20.13", "stage2-Tile-12.12"];
	self.message = ["activate", "reshape 64 32", "setup"];
	self.coolingTime = 600;
	self.resetTime = 60;
	return self;
}

stage2_trigger_2 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage2-Tile-7.13", "stage2-Tile-8.13", "stage2-Tile-9.13", "stage2-Tile-10.13",
					"stage2-Tile-7.14", "stage2-Tile-8.14", "stage2-Tile-9.14", "stage2-Tile-10.14"];
	self.message = ["hide", "hide", "hide", "hide",
					"hide", "hide", "hide", "hide"];
	self.coolingTime = 180;
	self.resetTime = 60;
	return self;
}

stage2_trigger_3 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage2-Tile-14.13", "stage2-Tile-15.13", "stage2-Tile-16.13", "stage2-Tile-17.13",
					"stage2-Tile-14.14", "stage2-Tile-15.14", "stage2-Tile-16.14", "stage2-Tile-17.14"];
	self.message = ["hide", "hide", "hide", "hide",
					"hide", "hide", "hide", "hide"];
	self.coolingTime = 180;
	self.resetTime = 60;
	self.activated = false;
	return self;
}

stage2_trigger_4 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage2-Tile-19.12"];
	self.message = ["moveTo -32 0 5"];
	self.coolingTime = 180;
	self.resetTime = 60;
	return self;
}

stage2_trigger_5 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage2_trigger_3", "stage2-Tile-20.13", "stage2-Tile-12.12"];
	self.message = ["deactivate", "reshape 32 32", "unset"];
	self.coolingTime = 600;
	self.resetTime = 60;
	return self;
}

stage2_trigger_6 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage2-Tile-4.18", "stage2-Tile-5.18", "stage2-Tile-3.20", "stage2-Tile-6.20"];
	self.message = ["moveTo -32 0 5", "moveTo 32 0 5", "moveTo 32 0 5", "moveTo -32 0 5"];
	self.coolingTime = 600;
	self.resetTime = 60;
	return self;
}
stage2_trigger_7 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage2-Tile-4.18", "stage2-Tile-5.18", "stage2-Tile-3.20", "stage2-Tile-6.20"];
	self.message = ["moveTo 0 0 5", "moveTo 0 0 5", "moveTo 0 0 5", "moveTo 0 0 5"];
	self.coolingTime = 600;
	self.resetTime = 60;
	self.activated = false;
	return self;
}

stage2_trigger_8 = function(owner){
	var self = TriggerController(owner);
	self.targets = ["stage2-Tile-4.16"];
	self.message = ["moveTo -32 0 3"];
	self.coolingTime = 600;
	return self;
}



var controllerLib = {
	BasicController: BasicController,
	BackgroundController: BackgroundController,
	PhysicsController: PhysicsController,
	ParticleController: ParticleController,
	PlayerController: PlayerController,
	PlayerExplosionController: PlayerExplosionController,
	PlayerSpawner: PlayerSpawner,
	TileController: TileController,
	nailController: nailController,
	SavePoint: SavePoint,
	WussController: WussController,
	stage1_trigger_1:stage1_trigger_1,
	stage1_trigger_2:stage1_trigger_2,
	stage1_trigger_3:stage1_trigger_3,
	stage2_trigger_1:stage2_trigger_1,
	stage2_trigger_2:stage2_trigger_2,
	stage2_trigger_3:stage2_trigger_3,
	stage2_trigger_4:stage2_trigger_4,
	stage2_trigger_5:stage2_trigger_5,
	stage2_trigger_6:stage2_trigger_6,
	stage2_trigger_7:stage2_trigger_7,
	stage2_trigger_8:stage2_trigger_8
}