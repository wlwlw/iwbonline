var fs = require('fs');
var xmlParser = require('xml2json');

readJSON = function(path){
	var obj = JSON.parse(fs.readFileSync(path, 'utf8'));
	return obj;
}

readXML = function(path){
	var xml = fs.readFileSync(path, 'utf8');
	var obj = JSON.parse(xmlParser.toJson(xml));
	return obj;
}

saveStageState = function(paht){}
readSaveFile = function(path){}

loadStageState = function(stageName){
	var path = './src/assets/Stages/'+stageName+'.json';
	//load from the exported file of map editor
	var stageStateJSON = readJSON(path);
	var tileSets = [];
	for(var i=0; i<stageStateJSON.tilesets.length; i++){
		var tileSetPath = stageStateJSON.tilesets[i].source;
		tileSetPath = tileSetPath.split('\/');
		tileSetPath[0] = "\/src\/assets";
		var tileSet = readXML('.'+tileSetPath.join('\/')).tileset;
		tileSet.firstgid = stageStateJSON.tilesets[i].firstgid;
		tileSets.push(tileSet);
	}
	//Tiles object by default using TileController
	var stageState = {
		name: stageName,
		width: stageStateJSON.width*stageStateJSON.tilewidth,
		height: stageStateJSON.height*stageStateJSON.tileheight,
		objects: {}
	}
	var layers = stageStateJSON.layers;
	for(var i=0; i<layers.length; i++){
		//create background image.
		if(layers[i].type=="imagelayer"){
			var imagePath = layers[i].image.split('\/');
			imagePath[0]="\/assets";
			stageState.objects[stageState.name+"-Background"]={
				name: layers[i].name,
				image: {source: imagePath.join('\/')},
				width: 800,
				height: 800,
				x: layers[i].x,
				y: layers[i].y
			};
		}
		//create ordinary gameobject
		if(layers[i].type=="objectgroup"){
			for(var j=0; j<layers[i].objects.length; j++){
				var object=layers[i].objects[j];
				var id = object.name;
				stageState.objects[id] = {
					name: object.name,
					x: object.x,
					y: object.y,
					width: object.width,
					height: object.height,
					collisionBody: {
						x:0, y:0,
						height: object.height,
						width: object.width
					}
				}
				if(object.hasOwnProperty("rotation")){
					stageState.objects[id].rotation = object.rotation;
				}
				stageState.objects[id].ControllerName = "BasicController";
				if(object.hasOwnProperty("properties")){
					for(var key in object.properties){
						if(object.properties.hasOwnProperty(key)){
							stageState.objects[id][key]=object.properties[key];
						}
					}
				}
			}
		}
		//create tiles objects
		if(layers[i].type=="tilelayer"){
			for(var j=0; j<layers[i].data.length; j++){
				var tileID=layers[i].data[j];
				if(tileID==0) continue;
				var id = stageState.name+'-Tile-'+j%layers[i].width+'.'+Math.floor(j/layers[i].width);
				var currentTileSet = {};
				for(var key in tileSets){
					var tileSet = tileSets[key];
					if(tileID>=tileSet.firstgid){
						currentTileSet = tileSet;
						tileID = tileID-tileSet.firstgid;
						break;
					}
				}
				if(Object.keys(currentTileSet).length==0)
					throw new RangeError("Invalid tileID: "+tileID);
				var tile = JSON.parse(JSON.stringify(currentTileSet.tile[tileID]));
				if(tile.hasOwnProperty("objectgroup")){
					if(tile.objectgroup.hasOwnProperty("properties")){
						var properties = tile.objectgroup.properties.property;
						if(properties.hasOwnProperty("length")){
							for(var k=0; k<properties.length; k++){
								tile[properties[k].name]=properties[k].value;
							}
						}else{
							tile[properties.name]=properties.value;
						}
						delete tile.objectgroup.properties;
					}
					if(tile.objectgroup.hasOwnProperty("object")){
						tile.collisionBody = tile.objectgroup.object;
						tile.collisionBody.x = parseInt(tile.collisionBody.x);
						tile.collisionBody.y = parseInt(tile.collisionBody.y);
						if(tile.collisionBody.hasOwnProperty("width")){
							tile.collisionBody.width = parseInt(tile.collisionBody.width);
							tile.collisionBody.height = parseInt(tile.collisionBody.height);
						}
						delete tile.objectgroup.object;
					}
					delete tile.objectgroup;
				}
				tile.name = id;
				tile.x = (j%layers[i].width)*stageStateJSON.tilewidth;
				tile.y = Math.floor(j/layers[i].width)*stageStateJSON.tileheight;
				tile.width = 32;
				tile.height = 32;
				if(!tile.hasOwnProperty("ControllerName"))
					tile.ControllerName = "TileController";
				tile.image.source = "/assets/"+currentTileSet.name+"/"+tile.image.source;
				stageState.objects[id]=tile;
			}
		}
	}
	return stageState;
}

exports.loadStageState = loadStageState;