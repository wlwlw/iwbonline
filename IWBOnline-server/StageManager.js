var fs = require('./fileSys.js');

StageManager = function(game){
	var self = {
		owner: game,
		stageWidth: 800,
		stageHeight: 800,
		stageLayout: [
			"testStage0","InitialStage", "stage1","stage2","ToBeContinue","testStage1",
			"testStage2", "testStage3", "testStage4","testStage5","testStage6","testStage7"
		],
		layoutWidth: 6,
		layoutHeight: 2,
		loadedStages: {}
	}
	self.getStageIndexByPos = function(pos){
		var m = Math.floor(pos.y/self.stageHeight);
		var n = Math.floor(pos.x/self.stageWidth);
		var index = m*self.layoutWidth+n;
		if(index>=self.stageLayout){
			return -1;
		}else{
			return index;
		}
	}
	self.loadStageByName = function(stageName){
		if(stageName==""||self.loadedStages.hasOwnProperty(stageName)) return "";
		self.loadedStages[stageName]=[];
		var index = self.stageLayout.findIndex(function(stage){
			return stage==stageName;
		})
		var origin = {
			x: self.stageWidth*(index%self.layoutWidth),
			y: self.stageHeight*Math.floor(index/self.layoutWidth)
		}
		console.log("Loading: "+stageName);
		var gameState = fs.loadStageState(stageName);
		for(var objectID in gameState.objects){
			if(gameState.objects.hasOwnProperty(objectID)){
				var state = gameState.objects[objectID];
				state.x += origin.x;
				state.y += origin.y;
				self.loadedStages[stageName].push(objectID);
				self.owner.objects[objectID]=GameObject(self.owner, state);
			}
		}
	}
	/*
	self.deleteStageByIndex = function(index){
		if(index<0||index>=self.stageLayout.length) return;
		var stageName = self.stageLayout[index];
		if(stageName==""||!self.loadedStages.hasOwnProperty(stageName)) return;
		while(self.loadedStages[stageName].length>0){
			delete self.owner.objects[self.loadedStages[stageName].pop()];
		}
		delete self.loadedStages[stageName];
	}
	self.getNextStageNameByPos = function(pos){
		var index = self.getStageIndexByPos(pos);
		if(index<0||index>=self.stageLayout.length) return [];
		var left = index-1;
		var right = index+1;
		var up = index-self.layoutWidth;
		var down = index+self.layoutWidth;
		var result = [];
		if(left>=0&&left<self.stageLayout.length&&self.stageLayout[left]!=""){
			result.push(self.stageLayout[left]);
		}
		if(right>=0&&right<self.stageLayout.length&&self.stageLayout[right]!=""){
			result.push(self.stageLayout[right]);
		}
		if(up>=0&&up<self.stageLayout.length&&self.stageLayout[up]!=""){
			result.push(self.stageLayout[up]);
		}
		if(down>=0&&down<self.stageLayout.length&&self.stageLayout[down]!=""){
			result.push(self.stageLayout[down]);
		}
		return result;
	}
	*/
	self.process = function(event){
		if(event.name=="LoadStage"){
			var stageName = event.data;
			var stageState = {
				clock: self.owner.clock, 
				name: stageName,
				objects:{}
			};
			if(!self.loadedStages.hasOwnProperty(stageName)){
				self.loadStageByName(stageName);
			}
			if(self.loadedStages.hasOwnProperty(stageName)){
				var stage = self.loadedStages[stageName];
				for(var i=0; i<stage.length; i++){
					var objectID = stage[i];
					if(self.owner.objects.hasOwnProperty(objectID)){
						stageState.objects[objectID]=self.owner.objects[objectID].state();
					}
				}
				self.owner.sockets[event.socketID].emit("StageEvent", {name: "StageState", data: stageState});
			}
		}
	}
	return self;
}



module.exports = StageManager;