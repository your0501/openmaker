import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

import * as PIXI from 'pixi.js';
import CompositeTilemap from '@pixi/tilemap';
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
loader.add('tileset', tileset);
loader.add('tileselector', tileselector);
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

let tilesetSprite, tileSelectorSprite, tileCursorSprite;
loader.onComplete.add((loader, resoueces) => {
    let texture = loader.resources.tileset.texture;
    tilesetSprite = new PIXI.Sprite(texture);
    app.stage.addChild(tilesetSprite);

    let texture2 = loader.resources.tileselector.texture;
    tileSelectorSprite = new PIXI.Sprite(texture2);
    app.stage.addChild(tileSelectorSprite);

    tileCursorSprite = new PIXI.Sprite(texture2);
    app.stage.addChild(tileCursorSprite);

    tileSelectorSprite.x = -32;
    tileCursorSprite.x = -32;
    console.log(loader.resources)

    const tilemapSprite = new PIXI.Sprite.from(document.getElementById('tilemap'));
    app.stage.addChild(tilemapSprite);
    tilemapSprite.x = 256 + 16;
    tilemapSprite.y = 0;
    console.log(tilemapSprite)
    //const tilemap = new PIXI.Sprite(tilemapTexture);
}); 



let x = 0;
let y = 0;
let tileX = 0;
let tileY = 0;
let tilesetIndex = 0;
let pressed = false;

let mapArray = new Array(32 * 32);

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
            let tool = button_tool;
            if (pressed) {
                if (tool == 'pen') {
                    mapArray[tileY * 32 + tileX] = tilesetIndex;
                } else if (tool == 'square') {
                    for (let i = 0; i < 32; i++) {
                        for (let j = 0; j < 32; j++) {
                            mapArray[tileY * 32 + tileX + i + j * 32] = tilesetIndex;
                            
                        }
                    }
                } else if (tool == 'circle') {
                    for (let i = 0; i < 32; i++) {
                        for (let j = 0; j < 32; j++) {
                            if (Math.sqrt(Math.pow(i - 16, 2) + Math.pow(j - 16, 2)) < 16) {
                                mapArray[tileY * 32 + tileX + i + j * 32] = tilesetIndex;
                            }
                        }
                    }
                } else if (tool == 'fill') {
                    let fillColor = mapArray[tileY * 32 + tileX];
                    for (let i = 0; i < 32; i++) {
                        for (let j = 0; j < 32; j++) {
                            if (mapArray[tileY * 32 + tileX + i + j * 32] == fillColor) {
                                mapArray[tileY * 32 + tileX + i + j * 32] = tilesetIndex;
                            }
                        }
                    }
                }
                

            }
        } else {
            tileCursorSprite.x = -32;
        }
    } else {
        x = 0;
        y = 0;
    }

});

window.addEventListener('mousedown', (e) => {
    let canvas = document.getElementById('pixi-canvas')
    if (e.button === 0 && canvas && tileCursorSprite) {
        console.log(x, y);
        if (isTilesetArea(tileX, tileY)) {
            tileSelectorSprite.x = tileX * 32;
            tileSelectorSprite.y = tileY * 32;
            tilesetIndex = tileX + tileY * 8;
        }

        if (isMapArea(tileX, tileY)) {
            pressed = true;
        }
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        if (isMapArea(tileX, tileY)) {
            pressed = false;
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
