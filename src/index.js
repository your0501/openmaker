import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
//import App from './App';
import reportWebVitals from './reportWebVitals';

import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Box';

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









let app = new PIXI.Application({
    width: 256 + 32 + 512,
    height: 512,
    backgroundColor: 0x000000
})

window.app = app;


const PixiComponent = () => {
    const ref = useRef(null);
    if (!app) {
        app = new PIXI.Application({
            width: 256 + 32 + 512,
            height: 512,
            backgroundColor: 0x000000
        })
    }
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

    window.tilemapEditor = new TilemapEditor();


    
}); 



let x = 0;
let y = 0;
let tileX = 0;
let tileY = 0;
let lastClickedTileX = 0;
let lastClickedTileY = 0;
let tilesetIndex = 0;
let pressed = false;

let mapEditorData = {};
window.mapEditorData = mapEditorData;

let mapArray = new Array(16*16).fill(0);
let tempMapArray = new Array(16*16).fill(0);


class TilemapEditor {
    constructor() {
        this.mapArray     = new Array(16*16).fill(0); // 맵 배열 
        this.tempMapArray = new Array(16*16).fill(0); // 임시 맵 배열 (수정중인 맵 배열)
        this.mapEditorData = {};
        this.tilesetIndex = 0; // 현재 선택하고있는 타일셋 인덱스
        this.tileX = 0;        // 현재 마우스가 위에 올라가있는 타일의 x좌표
        this.tileY = 0;        // 현재 마우스가 위에 올라가있는 타일의 y좌표
        this.lastClickedTileX = 0; // 마지막으로 클릭한 타일의 x좌표 (드래그 할때 사용)
        this.lastClickedTileY = 0; // 마지막으로 클릭한 타일의 y좌표
        this.pressed = false; // 마우스를 누르고 있는지 여부
        this.x = 0; // 마우스 이벤트리스너 x좌표
        this.y = 0; // 마우스 이벤트리스너 y좌표

        this._tilemapSprite = tilemapSprite; // 타일맵 스프라이트
        this._tileSelectorSprite = tileSelectorSprite; // 타일선택기 커서 스프라이트
        this._tileCursorSprite = tileCursorSprite; // 타일커서 스프라이트
        this._tilesetSprite = tilesetSprite; // 타일셋 스프라이트


        this.setupEventListerer();
    }

    isTileSelectorArea(tileX, tileY) {
        return (0 <= tileX && tileX < 8 && 0 <= tileY && tileY < 16) ? true : false; // 타일선택기 영역 안에 있는지 확인
    }

    isMapArea(tileX, tileY) {
        return (8 + 1 <= tileX && tileX < 25 && 0 <= tileY && tileY < 16) ? true : false; // 맵 영역 안에 있는지 확인
    }

    setupEventListerer() {
        document.addEventListener("mousemove", this.mouseMoveEvent.bind(this));
        document.addEventListener("mousedown", this.mouseDownEvent.bind(this));
        document.addEventListener("mouseup", this.mouseUpEvent.bind(this));
    }

    mouseMoveEvent = (e) => {
        let canvas = document.getElementById('pixi-canvas') // canvas 엘리먼트
        if (canvas && this._tileCursorSprite) {
            this.x = e.pageX - canvas.offsetLeft; // 마우스좌표 - canvas 위치
            this.y = e.pageY - canvas.offsetTop;
            this.tileX = Math.floor(this.x / 32); // 32px 기준으로 나누어서 정수형으로 변환하여 캔버스 위 타일의 x좌표
            this.tileY = Math.floor(this.y / 32);
            let tileX = this.tileX;
            let tileY = this.tileY;
            if (this.isMapArea(tileX, tileY)) { // 맵 영역에 마우스가 있는지 확인
                this._tileCursorSprite.x = tileX * 32; // 타일커서의 x좌표를 타일의 x좌표로 변경
                this._tileCursorSprite.y = tileY * 32; // 타일커서의 y좌표를 타일의 y좌표로 변경
            } else {
                this._tileCursorSprite.x = -32;
            }
            this.updateTool()
        } else {
            this.x = 0;
            this.y = 0;
        }
    }

    updateTool = () => {
        if (this.pressed) { // 마우스를 누르고 있는지 확인
            let tileX = this.tileX;
            let tileY = this.tileY;

            let realX = Math.max(Math.min(tileX - 9, 16), -1); // 맵 영역의 실제 x좌표
            let realY = Math.max(Math.min(tileY, 16), -1);// 맵 영역의 실제 x좌표
            
            let lastClickedRealX = this.lastClickedTileX - 9; // 마지막으로 클릭한 타일의 실제 x좌표
            let lastClickedRealY = this.lastClickedTileY;

            let tool = window.button_tool; // 현재 선택한 툴 / 전역변수 수정 필요.
            
            let tilesetIndex = this.tilesetIndex
            let mapArray = this.mapArray;

            if (tool == 'pen' || tool == 'eraser') {
                if (realX >= 0 && realY >= 0 && realX < 16 && realY < 16) {
                    this.tempMapArray[realY * 16 + realX] = (tool == 'pen') ? tilesetIndex : 0;
                    console.log(realY, realX, this.tempMapArray[realY * 16 + realX])
                }
            }
            else if (tool == 'square') {
                let realX = Math.max(Math.min(tileX - 9, 15), 0); // 맵 영역의 실제 x좌표
                let realY = Math.max(Math.min(tileY, 15), 0);// 맵 영역의 실제 x좌표

                this.tempMapArray = mapArray.map((value, index) => value);
                let maxI = Math.max(lastClickedRealX, realX);
                let minI = Math.min(lastClickedRealX, realX);
                let maxJ = Math.max(lastClickedRealY, realY);
                let minJ = Math.min(lastClickedRealY, realY);
                for (let i = minI; i <= maxI; i++) {
                    for (let j = minJ; j <= maxJ; j++) {
                        this.tempMapArray[j * 16 + i] = tilesetIndex;
                    }
                }
            } else if (tool == 'circle') {
                let realX = Math.max(Math.min(tileX - 9, 15), 0); // 맵 영역의 실제 x좌표
                let realY = Math.max(Math.min(tileY, 15), 0);// 맵 영역의 실제 x좌표
                this.tempMapArray = mapArray.map((value, index) => value);
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
                            this.tempMapArray[j * 16 + i] = tilesetIndex;
                        }
                    }
                }
            } else if (tool == 'fill') {
                this.tempMapArray = mapArray.map((value, index) => value);
                let fillArray = [];
                let fillIndex = this.tempMapArray[realY * 16 + realX];
                if (fillIndex == tilesetIndex) {
                    return;
                }
                fillArray.push([realX, realY]);
                while (fillArray.length > 0) {
                    let [x, y] = fillArray.pop();
                    if (this.tempMapArray[y * 16 + x] == fillIndex) {
                        this.tempMapArray[y * 16 + x] = tilesetIndex;
                        if (x > 0 && this.tempMapArray[y * 16 + x - 1] == fillIndex) {
                            fillArray.push([x - 1, y]);
                        }
                        if (x < 15 && this.tempMapArray[y * 16 + x + 1] == fillIndex) {
                            fillArray.push([x + 1, y]);
                        }
                        if (y > 0 && this.tempMapArray[(y - 1) * 16 + x] == fillIndex) {
                            fillArray.push([x, y - 1]);
                        }
                        if (y < 15 && this.tempMapArray[(y + 1) * 16 + x] == fillIndex) {
                            fillArray.push([x, y + 1]);
                        }
                    }
                }
            }
            this.updateTilemap(this.tempMapArray);
        }
    }
    mouseDownEvent = (e) => {
        let canvas = document.getElementById('pixi-canvas') // canvas 엘리먼트
        if (e.button === 0 && canvas && this._tileCursorSprite) { // 좌클릭이면서 캔버스가 있으면서 타일커서스프라이트
            let tileX = this.tileX;
            let tileY = this.tileY;
            console.log(tileX, tileY)
            if (this.isTileSelectorArea(tileX, tileY)) { // 타일셋 영역에 마우스가 있는지 확인
                this._tileSelectorSprite.x = tileX * 32;
                this._tileSelectorSprite.y = tileY * 32;
                this.tilesetIndex = tileX + tileY * 8 + 1; // 타일셀렉터 
            }

            if (this.isMapArea(tileX, tileY)) {
                this.pressed = true;
            }
            
            this.lastClickedTileX = tileX;
            this.lastClickedTileY = tileY;

            this.updateTool()
            
        }
    }

    mouseUpEvent = (e) => {
        if (e.button === 0) {
            let tileX = this.tileX;
            let tileY = this.tileY;
            if (true) {
                this.pressed = false;
                this.mapArray = this.tempMapArray;
            } 
            if (this.isMapArea(tileX, tileY)) {
                this.updateTilemap(this.mapArray)
            }
        }
    }

    updateTilemap = function(mapArray) {
        this._tilemapSprite.clear()
        for (let j = 0; j < 16; j++) {
            for (let i = 0; i < 16; i++) {
                let index = j * 16 + i;
                if (mapArray[index] != 0) { // 맵 배열이 0이 아닐 때만 그림.

                    let tileset_xpos = ((mapArray[index] - 1) % 8) * 32;
                    let tileset_ypos = Math.floor((mapArray[index] - 1) / 8) * 32;

                    this._tilemapSprite.tile(this._tilemapSprite.tileset, i * 32, j * 32, {
                        u: tileset_xpos, v: tileset_ypos, tileWidth: 32, tileHeight: 32
                    });
                } else {
                    this._tilemapSprite.tile(this._tilemapSprite.emptytile, i * 32, j * 32);
                }
            }
        }
    }
}



/*
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
*/






window.button_tool = 'pen';
function DrawButtons() {
    const [tool, setTool] = React.useState('pen');

    const handleTool = (event, newTool) => {
        setTool(newTool);
        window.button_tool = newTool;
    };

    return (
        <ToggleButtonGroup
            value={tool}
            exclusive
            onChange={handleTool}
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

window.layer_tool = '1';
function DrawLayerButtons() {
    const [layer, setLayer] = React.useState('1');

    const handleLayer = (event, newTool) => {
        setLayer(newTool);
        window.layer_tool = newTool;
    };

    return (
        <ToggleButtonGroup
            value={layer}
            exclusive
            onChange={handleLayer}
            color="secondary"
        >
            <ToggleButton value="1">
                one
            </ToggleButton>

            <ToggleButton value="2">
                two
            </ToggleButton>

            <ToggleButton value="3">
                three
            </ToggleButton>

            <ToggleButton value="free">
                free
            </ToggleButton>

            <ToggleButton value="event">
                event
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
                
                <ButtonGroup>
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

                    
                </ButtonGroup>
                <Box className="App-toolbar" elevation={3}> 
                    <ToggleButtonGroup>
                        <DrawButtons/>
                        <Divider orientation="vertical" flexItem></Divider>
                        <DrawLayerButtons/>
                    </ToggleButtonGroup>
                </Box> 
                
            </Box>
            <PixiComponent/>
            
            
        </header>
        
            
        </div>
    );
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);