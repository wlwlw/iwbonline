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
	self.getNextStageNameByPos = function(pos){
		var index = self.getStageIndexByPos(pos);
		if(index<0||index>=self.stageLayout.length) return ["InitialStage"];
		var left = index-1;
		var right = index+1;
		var up = index-self.layoutWidth;
		var down = index+self.layoutWidth;
		var result = [self.stageLayout[index]];
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
		if(!result.includes("InitialStage"))
			result.push("InitialStage");
		if(self.owner.SavePoint!=null){
			var savepos = {x:self.owner.SavePoint.x, y:self.owner.SavePoint.y};
			var index = self.getStageIndexByPos(savepos);
			if(!result.includes(self.stageLayout[index]))
				result.push(self.stageLayout[index]);
		}
		return result;
	}
	self.updateStageByPos = function(pos){
		var names = self.getNextStageNameByPos(pos);
		for(var i=0; i<names.length; i++){
			self.updateStageByName(names[i]);
		}
		/*Unload unnecessary stage to save memory */
		for(var stageName in self.loadedStages){
			if(!names.includes(stageName)){
				self.unloadStage(stageName);
			}
		}
	}
	self.updateStageByName = function(stageName){
		if(stageName!=""&&!self.loadedStages.hasOwnProperty(stageName)){
			self.owner.serverSocket.emit("StageEvent", {name: "LoadStage", data: stageName});
		}
	}
	self.loadStage = function(stageState){
		var stageName = stageState.name;
		self.loadedStages[stageName] = [];
		for(var objectID in stageState.objects){
			if(stageState.objects.hasOwnProperty(objectID)){
				var state = stageState.objects[objectID];
				self.loadedStages[stageName].push(objectID);
				self.owner.objects[objectID]=GameObject(self.owner, state);
			}
		}
	}
	self.unloadStage = function(stageName){
		while(self.loadedStages[stageName].length>0){
			delete self.owner.objects[self.loadedStages[stageName].pop()];
		}
		delete self.loadedStages[stageName];
	}
	self.process = function(event){
		if(event.name=="StageState"){
			self.loadStage(event.data);
		}
	}
	return self;
}