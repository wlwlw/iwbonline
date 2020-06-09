QuadTree = function(level, bounds){
	var self = {
		level: level,
		bounds: bounds,
		MAX_OBJECTS: 10,
		MAX_LEVELS: 5,
		objects: [],
		nodes: [null, null, null, null]
	}
	self.clear = function(){
		self.objects = [];
		for(var i=0; i<self.nodes.length; i++){
			if(nodes[i]!=null){
				nodes[i].clear();
				nodes[i]=null;
			}
		}
	}
	self.split = function(){
		var subWidth = Math.floor(self.bounds.width/2);
		var subHeight = Math.floor(self.bounds.height/2);
		var x = self.bounds.x;
		var y = self.bounds.y;
		self.nodes[0]=QuadTree(self.level+1, {x: x, y: y, width: subWidth, height: subHeight });
		self.nodes[1]=QuadTree(self.level+1, {x: x+subWidth, y: y, width: subWidth, height: subHeight });
		self.nodes[2]=QuadTree(self.level+1, {x: x, y: y+subHeight, width: subWidth, height: subHeight });
		self.nodes[3]=QuadTree(self.level+1, {x: x+subWidth, y: y+subHeight, width: subWidth, height: subHeight });
	}
	self.getIndex = function(rect){
		var midX = bounds.x+Math.floor(bounds.width/2);
		var midY = bounds.y+Math.floor(bounds.height/2);
		var fitUp = (rect.y+rect.height<midY);
		var fitDown = (rect.y>midY);
		var fitLeft = (rect.x+rect.width<midX);
		var fitRight = (rect.x>midX);
		if(fitUp&&fitLeft) return 0;
		if(fitUp&&fitRight) return 1;
		if(fitDown&&fitLeft) return 2;
		if(fitDown&&fitRight) return 3;
		return -1;
	}
	self.insert = function(rect){
		if(self.nodes[0]!=null){
			var index = self.getIndex(rect);
			if(index!=-1){
				self.nodes[index].insert(rect);
				return;
			}
		}
		self.objects.push(rect);
		if(self.objects.length>self.MAX_OBJECTS&&self.level<self.MAX_LEVELS){
			if(self.nodes[0]==null){
				self.split();
				var l=self.objects.length;
				for(var i=0; i<l; i++){
					var rect = self.objects.shift(i);
					var index = self.getIndex(rect);
					if(index!=-1){
						self.nodes[index].insert(rect);
					}else{
						self.objects.push(rect);
					}
				}
			}
		}
	}
	self.objectNear = function(rect){
		var index = self.getIndex(rect);
		var result = [];
		result = result.concat(self.objects);
		if(self.nodes[0]!=null){
			if(index!=-1)
				result = result.concat(self.nodes[index].objectNear(rect));
			else
				for(var i=0; i<self.nodes.length; i++)
					result = result.concat(self.nodes[i].objectNear(rect));
		}
		return result;
	}
	return self;
}

vectorDot2d = function(vec1, vec2){
	return vec1.x*vec2.x+vec1.y*vec2.y;
}
vectorSum2d = function(vec1, vec2){
	var newVec = {
		x: vec1.x+vec2.x,
		y: vec1.y+vec2.y
	}
	return newVec;
}
minProj = function(polygon, axis){
	var minProj = vectorDot2d(polygon[0], axis);
	for(var i=1; i<polygon.length; i++){
		minProj=Math.min(minProj, vectorDot2d(polygon[i], axis));
	}
	return minProj;
}
maxProj = function(polygon, axis){
	var maxProj = vectorDot2d(polygon[0], axis);
	for(var i=1; i<polygon.length; i++){
		maxProj=Math.max(maxProj, vectorDot2d(polygon[i], axis));
	}
	return maxProj;
}

testPolygonOverlap = function(object1, object2){
	//prepare vertexs
	var col1 = object1.collisionBody;
	var col2 = object2.collisionBody;
	if(!col1.hasOwnProperty("points")){
		if(col1.hasOwnProperty("polygon")){
			var points = col1.polygon.points.split(' ');
			points = points.map(s=>{
				var x=s.split(',');
				return {x: col1.x+parseInt(x[0]), y: col1.y+parseInt(x[1])};
			})
			col1["points"]=points;
		}else{
			col1.points=[
				{x: col1.x, y: col1.y},
				{x: col1.x, y: col1.y+col1.height},
				{x: col1.x+col1.width, y: col1.y+col1.height},
				{x: col1.x+col1.width, y: col1.y},
			]
		}
	}
	if(!col2.hasOwnProperty("points")){
		if(col2.hasOwnProperty("polygon")){
			
			var points = col2.polygon.points.split(' ');
			points=points.map(s=>{
				var x=s.split(',');
				return {x: col2.x+parseInt(x[0]), y: col2.y+parseInt(x[1])};
			})
			col2["points"]=points;
		}else{
			col2.points=[
				{x: col2.x, y: col2.y},
				{x: col2.x, y: col2.y+col2.height},
				{x: col2.x+col2.width, y: col2.y+col2.height},
				{x: col2.x+col2.width, y: col2.y},
			]
		}
	}
	var polygon1 = [];
	var polygon2 = [];
	var pos1 = {x:object1.x, y:object1.y};
	var pos2 = {x:object2.x, y:object2.y};
	if(object1.hasOwnProperty("vx")&&object1.hasOwnProperty("vy")){
		pos1.x += object1.vx;
		pos1.y += object1.vy;
	}
	if(object2.hasOwnProperty("vx")&&object2.hasOwnProperty("vy")){
		pos2.x += object2.vx;
		pos2.y += object2.vy;
	}
	for(var i=0; i<col1.points.length; i++){
		polygon1.push(vectorSum2d(pos1, col1.points[i]));
	}
	for(var i=0; i<col2.points.length; i++){
		polygon2.push(vectorSum2d(pos2, col2.points[i]));
	}

	//test overlap
	for(var i=0; i<polygon1.length-1; i++){
		var axis = {
			x: (polygon1[i+1].y-polygon1[i].y),
			y: -(polygon1[i+1].x-polygon1[i].x)
		};//use right norm of polygon edge as axis
		if(maxProj(polygon1, axis)<=minProj(polygon2, axis)
			||maxProj(polygon2, axis)<=minProj(polygon1, axis))
			return false;
	}
	for(var i=0; i<polygon2.length-1; i++){
		var axis = {
			x: (polygon2[i+1].y-polygon2[i].y),
			y: -(polygon2[i+1].x-polygon2[i].x)
		};//use right norm of polygon edge as axis
		if(maxProj(polygon1, axis)<=minProj(polygon2, axis)
			||maxProj(polygon2, axis)<=minProj(polygon1, axis))
			return false;
	}
	return true;
}

testAABBOverlap = function(object1, object2){
	var xmin1 = object1.x+object1.collisionBody.x;
	var ymin1 = object1.y+object1.collisionBody.y;
	var xmax1 = object1.x+object1.collisionBody.x+object1.collisionBody.width;
	var ymax1 = object1.y+object1.collisionBody.y+object1.collisionBody.height;
	var xmin2 = object2.x+object1.collisionBody.x;
	var ymin2 = object2.y+object1.collisionBody.y;
	var xmax2 = object2.x+object2.collisionBody.x+object2.collisionBody.width;
	var ymax2 = object2.y+object2.collisionBody.y+object2.collisionBody.height;
	if(xmin1>xmax2||ymin1>ymax2||xmin2>xmax1||ymin2>ymin1)
		return false;
	else
		return true;
}

collisionDetect = function(objects, bounds){
	//build QuadTree
	var space = QuadTree(0, bounds);
	var nameList = Object.keys(objects);
	for(var i=0; i<nameList.length; i++){
		var object = objects[nameList[i]];
		if(object.hasOwnProperty("collisionBody")){
			var body = object.collisionBody;
			space.insert({
				name: object.name,
				x: object.x+body.x,
				y: object.y+body.y,
				width: body.width,
				height: body.height
			});
		}
	}
	//Run collision detection on spatially adjacent objects defined by quadtree
	var checked = new Set();
	for(var i=0; i<nameList.length; i++){
		var object1 = objects[nameList[i]];
		//only consider player and mouse event
		if(object1.ControllerName!="PlayerController"
			&&object1.type!="mouse"
			&&object1.type!="physical") continue;

		if(!object1.hasOwnProperty("collisionBody")) continue;
		var body = object1.collisionBody;
		//console.log(space.objects);
		var nearbys = space.objectNear({
			name: object1.name,
			x: object1.x+body.x,
			y: object1.y+body.y,
			width: body.width,
			height: body.height
		});
		for(var key in nearbys){
			var rect = nearbys[key];
			var object2 = objects[rect.name];
			if(checked.has(object1.name+object2.name)||checked.has(object2.name+object1.name)||object1.name==object2.name) continue;
			checked.add(object1.name+object2.name);
			if(testPolygonOverlap(object1, object2)){
				//console.log("collision: "+object1.name+'-'+object2.name);
				object1.receive({name: "Collision", target: object2});
				object2.receive({name: "Collision", target: object1});
			}
		}
	}
}

collisionDetectTest = function(objects, bounds){
	object1 = {
		x:307, y:640,
		collisionBody: {
			x:-21, y:-21,
			width: 18, height:21
		}
	}
	object2 = {
		x:256, y:608,
		collisionBody: {
			x:0, y:0,
			width: 32,
			height: 32,
		}
	}
	console.log("result:"+testPolygonOverlap(object1, object2));
}