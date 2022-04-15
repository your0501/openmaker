import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

import * as PIXI from 'pixi.js';
import * as PIXI_Tilemap from '@pixi/tilemap';
import './App.css';

import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import SaveIcon from '@mui/icons-material/Save'

import ContentCutIcon from '@mui/icons-material/ContentCut'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import ClearIcon from '@mui/icons-material/Clear';

import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import AppsIcon from '@mui/icons-material/Apps';

import BrushIcon from '@mui/icons-material/Brush';
import DeleteIcon from '@mui/icons-material/Delete';
import SquareIcon from '@mui/icons-material/Square';
import CircleIcon from '@mui/icons-material/Circle';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import { useRef, useEffect } from 'react';
import * as React from 'react';



const app = new PIXI.Application({
    width: 256 + 32 + 512,
    height: 512,
    backgroundColor: 0x000000
})

const PixiComponent = () => {
    const ref = useRef(null);
    let ctx = null;

    useEffect(() => {
        ref.current.appendChild(app.view);
        app.view.setAttribute('id', 'pixi-canvas')
        app.start();

        return () => {
            app.stop();
            ref.current.removeChild(app.view);
        }
    }, []);

    return (
        <div id="pixi" className="App-pixi" ref={ref}>
        </div>
    );
}


const loader = new PIXI.Loader();
const sprites = {};

let tileset = require("./assets/tileset.png");
let tileselector = require("./assets/tile_selector.png");
let emptytile = require("./assets/empty_tile.png");
loader.add('tileset', tileset);
loader.add('tileselector', tileselector);
loader.add('emptytile', emptytile);
loader.load()


const gr = new PIXI.Graphics();
gr.beginFill(0xff7777);
gr.drawRect(256, 0, 32, 512);
app.stage.addChild(gr);





loader.onProgress.add((loader, resources) => {
    console.log(loader.progress + "% loaded");
}); 

loader.onError.add((loader, resources) => {
    console.error("load error");
}); 

loader.onLoad.add((loader, resources) => {
    console.log("loaded");
}); 

let tilesetSprite, tileSelectorSprite, tileCursorSprite, tilemapSprite;
loader.onComplete.add((loader, resoueces) => {
    let texture = loader.resources.tileset.texture;
    tilesetSprite = new PIXI.Sprite(texture);
    app.stage.addChild(tilesetSprite);

    let texture2 = loader.resources.tileselector.texture;
    tileSelectorSprite = new PIXI.Sprite(texture2);
    app.stage.addChild(tileSelectorSprite);


    tilemapSprite = new PIXI_Tilemap.CompositeTilemap();
    tilemapSprite.tileset = loader.resources.tileset.texture;
    tilemapSprite.emptytile = loader.resources.emptytile.texture;
    tilemapSprite.x = 256+32;
    tilemapSprite.y = 0;
    app.stage.addChild(tilemapSprite);

    tileCursorSprite = new PIXI.Sprite(texture2);
    app.stage.addChild(tileCursorSprite);


    
    tileSelectorSprite.x = -32;
    tileCursorSprite.x = -32;
    console.log(loader.resources)


    
}); 



let x = 0;
let y = 0;
let tileX = 0;
let tileY = 0;
let lastClickedTileX = 0;
let lastClickedTileY = 0;
let tilesetIndex = 0;
let pressed = false;



let mapArray = new Array(16*16).fill(0);
let tempMapArray = new Array(16*16).fill(0);

const isTilesetArea = function(tileX, tileY) {
    return (0 <= tileX && tileX < 8 && 0 <= tileY && tileY < 16) ? true : false;
}

const isMapArea = function(tileX, tileY) {
    return (8 + 1 <= tileX && tileX < 25 && 0 <= tileY && tileY < 16) ? true : false;
}

window.addEventListener('mousemove', (e) => {
    let canvas = document.getElementById('pixi-canvas')
    if (canvas && tileCursorSprite) {
        x = e.pageX - canvas.offsetLeft; 
        y = e.pageY - canvas.offsetTop;
        tileX = Math.floor(x / 32);
        tileY = Math.floor(y / 32);
        if (isMapArea(tileX, tileY)) {
            tileCursorSprite.x = tileX * 32;
            tileCursorSprite.y = tileY * 32;

            let realX = tileX - 9;
            let realY = tileY;
            
            let lastClickedRealX = lastClickedTileX - 9;
            let lastClickedRealY = lastClickedTileY;

            let tool = button_tool;
            if (pressed) {

                if (tool == 'pen' || tool == 'eraser') {
                    tempMapArray[realY * 16 + realX] = (tool == 'pen') ? tilesetIndex : 0;
                    console.log(realY, realX, tempMapArray[realY * 16 + realX])
                }
                else if (tool == 'square') {
                    tempMapArray = mapArray.map((value, index) => value);
                    let maxI = Math.max(lastClickedRealX, realX);
                    let minI = Math.min(lastClickedRealX, realX);
                    let maxJ = Math.max(lastClickedRealY, realY);
                    let minJ = Math.min(lastClickedRealY, realY);
                    for (let i = minI; i <= maxI; i++) {
                        for (let j = minJ; j <= maxJ; j++) {
                            tempMapArray[j * 16 + i] = tilesetIndex;
                        }
                    }
                } else if (tool == 'circle') {
                    tempMapArray = mapArray.map((value, index) => value);
                    let maxI = Math.max(lastClickedRealX, realX);
                    let minI = Math.min(lastClickedRealX, realX);
                    let maxJ = Math.max(lastClickedRealY, realY);
                    let minJ = Math.min(lastClickedRealY, realY);
                    let long_radius = Math.max(maxI - minI, maxJ - minJ) / 2;
                    let short_radius = Math.max(maxI - minI, maxJ - minJ) / 2;

                    for (let i = minI; i <= maxI; i++) {
                        for (let j = minJ; j <= maxJ; j++) {
                            let x = i - long_radius;
                            let y = j - short_radius;
                            if (x ** 2 * long_radius ** 2 + y ** 2 * short_radius ** 2 <= long_radius ** 2 * short_radius ** 2) {
                                tempMapArray[j * 16 + i] = tilesetIndex;
                            }
                        }
                    }
                }


                window.updateTilemap(tempMapArray)
            }
        } else {
            tileCursorSprite.x = -32;
        }
    } else {
        x = 0;
        y = 0;
    }
});

window.updateTilemap = function(mapArray) {
    tilemapSprite.clear()
    for (let j = 0; j < 16; j++) {
        for (let i = 0; i < 16; i++) {
            let index = j * 16 + i;
            if (mapArray[index] != 0) { // 맵 배열이 0이 아닐 때만 그림.

                let tileset_xpos = ((mapArray[index] - 1) % 8) * 32;
                let tileset_ypos = Math.floor((mapArray[index] - 1) / 8) * 32;

                tilemapSprite.tile(tilemapSprite.tileset, i * 32, j * 32, {
                    u: tileset_xpos, v: tileset_ypos, tileWidth: 32, tileHeight: 32
                });
            } else {
                tilemapSprite.tile(tilemapSprite.emptytile, i * 32, j * 32);
            }
        }
    }
}
window.addEventListener('mousedown', (e) => {
    let canvas = document.getElementById('pixi-canvas')
    if (e.button === 0 && canvas && tileCursorSprite) {
        //console.log(x, y);
        if (isTilesetArea(tileX, tileY)) {
            tileSelectorSprite.x = tileX * 32;
            tileSelectorSprite.y = tileY * 32;
            tilesetIndex = tileX + tileY * 8 + 1;
            console.log(tilesetIndex)

        }

        if (isMapArea(tileX, tileY)) {
            pressed = true;
        }
        
        lastClickedTileX = tileX;
        lastClickedTileY = tileY;
        
        
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        if (isMapArea(tileX, tileY)) {
            pressed = false;
            mapArray = tempMapArray;
            window.updateTilemap(mapArray)
        }
    }
});

window.app = app;


let button_tool = 'pen';
function DrawButtons() {
    const [tool, setTool] = React.useState('pen');

    const handleTool = (event, newTool) => {
        setTool(newTool);
        button_tool = newTool
    };

    return (
        <ToggleButtonGroup id="toolList"
            value={tool}
            exclusive
            onChange={handleTool}
            aria-label="text alignment"
            color="secondary"
        >
            <ToggleButton value="pen">
                <BrushIcon/>
            </ToggleButton>

            <ToggleButton value="eraser">
                <DeleteIcon/>
            </ToggleButton>

            <ToggleButton value="square">
                <SquareIcon/>
            </ToggleButton>

            <ToggleButton value="circle">
                <CircleIcon/>
            </ToggleButton>

            <ToggleButton value="fill">
                <FormatPaintIcon/>
            </ToggleButton>

            <ToggleButton value="shadow">
                <CircleIcon/>
            </ToggleButton>



        </ToggleButtonGroup>
    );
}



function App() {
    return (
        <div className="App">
        <header className="App-header">
            <ButtonGroup variant="contained">
                <Button>파일</Button>
                <Button>편집</Button>
                <Button>모드</Button>
                <Button>그리기</Button>
                <Button>확대</Button>
                <Button>도구</Button>
                <Button>게임</Button>
                <Button>도움말</Button>
            </ButtonGroup>

            <Box className="App-button" elevation={3}> 
                
                <ButtonGroup variant="contained" color="secondary">
                    <ButtonGroup variant="contained" color="secondary">
                        <Button><CreateNewFolderIcon/></Button>
                        <Button><FileOpenIcon/></Button>
                        <Button><SaveIcon/></Button>
                    </ButtonGroup>
                    <Divider orientation="vertical" flexItem></Divider>
                    <ButtonGroup variant="contained" color="secondary">
                        <Button><ContentCutIcon/></Button>
                        <Button><ContentCopyIcon/></Button>
                        <Button><ContentPasteIcon/></Button>
                        <Button><ClearIcon/></Button>
                    </ButtonGroup>
                    <Divider orientation="vertical" flexItem></Divider>
                    <ButtonGroup variant="contained" color="secondary">
                        <Button><MapIcon/></Button>
                        <Button><PersonIcon/></Button>
                        <Button><AppsIcon/></Button>
                    </ButtonGroup>
                    <Divider orientation="vertical" flexItem></Divider>
                    <DrawButtons/>
                    {/*<ButtonGroup variant="contained" color="secondary">
                        <Button><BrushIcon/></Button>
                        <Button><SquareIcon/></Button>
                        <Button><CircleIcon/></Button>
                        <Button><FormatPaintIcon/></Button>
                        <Button><CircleIcon/></Button>
                    </ButtonGroup>*/}
                </ButtonGroup>
                <PixiComponent/>
            </Box>
            <canvas id="tilemap" width={512} height={512}/>
            
        </header>
        
            
        </div>
    );
}



export default App;
