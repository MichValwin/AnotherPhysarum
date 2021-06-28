function Cell(x, y, angle){
    this.x = x;
    this.y = y;
    this.angle = angle //In degrees. Facing right is 0º
}

function populateTrailMap(map, width, height){
    for(let i = 0; i < height; i++){
        for(let j = 0; j < width; j++){
            map[width * i + j] = 0.0;
        }
    }
}

function paintRectangle(map, width, height, posX, posY, rectWidth, rectHeight){
    if(posX < 0)posX = 0;
    if(posX > width)posX = width;
    if(posY < 0)posY = 0;
    if(posY > height)posY = height;
    
    if(posX + rectWidth < 0)rectWidth = 0;
    if(posX + rectWidth > width)rectWidth = 0;
    if(posY + rectHeight < 0)rectHeight = 0;
    if(posY + rectHeight > width)rectHeight = 0;
    
    
    for(let i = posY; i < posY + rectHeight; i++){
        for(let j = posX; j < posX + rectWidth; j++){
            map[i * width + j] = 1.0;
        }
    }
}
    
function copyTrailMapTexture(cells, map, bufferTexture, width, height){
    for(let i = 0; i < height; i++){
        for(let j = 0; j < width; j++){
            bufferTexture[width * 4 * i + j*4] = map[width * i + j];	//Red
            bufferTexture[width * 4 * i + j*4 + 1] = 0.0;				//Green
            bufferTexture[width * 4 * i + j*4 + 2] = 0.0;				//Blue
            bufferTexture[width * 4 * i + j*4 + 3] = 1.0;				//Transparency
        }
    }
    
    //Paint cells 
    for(let i = 0; i < cells.length; i++){
        let x = Math.floor(cells[i].x);
        let y = Math.floor(cells[i].y);
        bufferTexture[width * 4 * y + x*4 + 1] = 0.5;
    }
}
    
    
function populateCells(cells, numberCells, mapWidth, mapHeigth){
    for(let i = 0; i < numberCells; i++){
        let x = Math.random() * mapWidth;
        let y = Math.random() * mapHeigth;
        
        let angle =45.0 * Math.random();
        let cell = new Cell(x, y, angle);
        cells[i] = cell;
    }
}
    
function rotate(x, y, degrees){
    let radians = degrees * Math.PI / 180.0;

    let rotX = x * Math.cos(radians) - y * Math.sin(radians);
    let rotY = x * Math.sin(radians) + y * Math.cos(radians);

    return {'x' : rotX, 'y' : rotY};
}

function checkSensor(sensor, angle, sensorDistance, posX, posY, map, mapWidth, mapHeight){
    var sensorRotated = rotate(sensor.x, sensor.y, angle); 

    var sensorPosition = {'x': Math.floor(sensorRotated.x * sensorDistance + posX), 
                            'y': Math.floor(sensorRotated.y * sensorDistance + posY)};
                            
    if(sensorPosition.x < 0 || sensorPosition.x >= mapWidth || sensorPosition.y < 0 || sensorPosition.y >= mapHeight) {
        return 0.0;
    }else{
        return map[sensorPosition.y * mapWidth + sensorPosition.x];
    }
}

function isPositionCorrect(x, y, mapWidth, mapHeight){
    if(x < 0 || x >= mapWidth || y < 0 || y >= mapHeight)return false;
    return true;
}


function updatePhysarum(cells, map, mapClone, optionsPhysarum, mapWidth, mapHeight){

    for(let i = 0; i < cells.length; i++){
        let cell = cells[i];
        
        //Sensors with angle
        let midSensor = {'x': 1.0, 'y': 0.0};
        let upSensor = rotate(midSensor.x, midSensor.y, optionsPhysarum.sensorAngle);
        var downSensor = rotate(midSensor.x, midSensor.y, -optionsPhysarum.sensorAngle);
        
        let midSensorValue = checkSensor(midSensor, cell.angle, optionsPhysarum.sensorDistance, cell.x, cell.y, map, mapWidth, mapHeight);
        let upSensorValue = checkSensor(upSensor, cell.angle, optionsPhysarum.sensorDistance, cell.x, cell.y, map, mapWidth, mapHeight);
        let downSensorValue = checkSensor(downSensor, cell.angle, optionsPhysarum.sensorDistance, cell.x, cell.y, map, mapWidth, mapHeight);
        
        //decision making
        
        //Turn
        if(midSensorValue > downSensorValue && midSensorValue > upSensorValue){
            //Continue forward
            
            
        }else if(midSensorValue < downSensorValue && midSensorValue < upSensorValue){
            //Turn randomly
            let rand = Math.random();
            if(rand > 0.5){
                //Turn right
                cell.angle -= optionsPhysarum.turnAngle;
            }else{
                //Turn left
                cell.angle += optionsPhysarum.turnAngle;
            }
            
        }else if(downSensorValue > upSensorValue){
            //Turn right
            cell.angle -= optionsPhysarum.turnAngle;
        }else if(upSensorValue > downSensorValue){
            //Turn left
            cell.angle += optionsPhysarum.turnAngle;
        }
        
        
        //Move
        var move = rotate(1.0, 0.0, cell.angle);
        move.x *= optionsPhysarum.moveOffset;
        move.y *= optionsPhysarum.moveOffset;
        if(cell.x + move.x >= 0.0 &&  cell.x + move.x <= mapWidth &&
            cell.y + move.y >= 0.0 &&  cell.y + move.y <= mapHeight){
            cell.x += move.x;
            cell.y += move.y;
        }else{
            cell.angle += 60.0;
        }
        
        //deposit
        map[Math.floor(cell.y) * mapWidth + Math.floor(cell.x)] += 0.2;
        
        
        
        
        cells[i].x  = cell.x;
        cells[i].y  = cell.y;
        cells[i].angle  = cell.angle;
    }
    
    //Difusse
    //Kernel matrix Gaussian blur
    var boxMatrix = 	[1, 1, 1,
                         1, 20, 1,
                         1, 1, 1];
    var gaussianBlur =  [1, 2, 1,
                         2, 4, 2,
                         1, 2, 1];
    var sharpen =  		[0, -1, 0,
                         -1, 5, -1,
                         0, -1, 0];
    
    for(let i = 0; i < mapHeight; i++){
        for(let j = 0; j < mapWidth; j++){
            let total = 0;
            let compute = 0;
            
            for(let ii = 0; ii < 3; ii++){
                for(let jj = 0; jj < 3 ; jj++){
                    let x = (j-1) + jj;
                    let y = (i-1) + ii;
                
                    if(isPositionCorrect(x, y, mapWidth, mapHeight)){
                        total += map[mapWidth * y + x] * boxMatrix[ii*3 + jj] * (1.0 / 28.0);
                        compute++;
                    }else{
                        //compute++;
                    }
                }
            }

            
            mapClone[mapWidth * i + j] = total;
        }
    }
    
    for(let i = 0; i < mapHeight; i++){
        for(let j = 0; j < mapWidth; j++){
            //map[mapWidth * i + j] = mapClone[mapWidth * i + j];
            if(mapClone[mapWidth * i + j] > 1.0 || mapClone[mapWidth * i + j] < 0.0){
                //console.log(mapClone[width * i + j]);
            }
        }
    }
    
    
    
    //decay
    for(var i = 0; i < map.length; i++){
        map[i] *= optionsPhysarum.decay;
        if(map[i] < 0.0)map[i] = 0.0;
        if(map[i] > 1.0)map[i] = 1.0;
    }
    
}