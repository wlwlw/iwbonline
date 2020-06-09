BasicController = function(owner){
	var self = {
		owner: owner
	}
	self.update = function(owner){}
	self.eventHandler = function(event){}
	return self;
}

BackgroundController = function(owner){
	var self = BasicController(owner);
	//self.drawn = false;
	return self;
}

PlayerController = function(owner){
	var self = BasicController(owner);
	return self;
}
PlayerSpawner = function(owner){
	self = BasicController(owner);
	self.eventHandler = function(event){
		if(event.name=="Login"){
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
			owner.env.players[event.playerID] = {
				socket: owner.env.sockets[event.socketID], 
				object: owner.env.objects[event.playerID]
			};
		}
	}
	return self;
}
TileController = function(owner){
	var self = BasicController(owner);
	return self;
}
SavePointController = function(owner){
	var self = BasicController(owner);
	return self;
}

exports.BasicController = BasicController;
exports.PlayerController = PlayerController;
exports.PlayerSpawner = PlayerSpawner;
exports.TileController = TileController;
