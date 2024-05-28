import { useState, useEffect } from 'react'
import axios from 'axios';

import MoodMeter from '../assets/mood_meter.jpg'
import Clipboard from '../assets/clipboard.svg';
import { API_BASE_URL, CROSSHAIR_SIZE } from '../Constants';
import PlayerCoords from '../dao/PlayerCoords';
import PlayerList from './PlayerList';

function Canvas() {
  const [points, setPoints] = useState<Array<PlayerCoords>>([]);
  const [playerPoint, setPlayerPoint] = useState<PlayerCoords|null>(null);

  // load from local storage
  let userId: string = localStorage.getItem("userId") || "";
  let userColor: string = localStorage.getItem("userColor") || "";
  let gameId: string = localStorage.getItem("gameId") || "";

  if (userId == "" || userColor == "" || gameId == "") {
    throw new Error("Local state corrupted.");
  }

	function getMousePosition(canvas: any, event: any): PlayerCoords {
	    let rect = canvas.getBoundingClientRect();
      const rectWidth = rect.right - rect.left;
      const rectHeight = rect.bottom - rect.top;
	    let x = (event.clientX - rect.left) / rectWidth;
	    let y = (event.clientY - rect.top) / rectHeight;
      const point: PlayerCoords = {player_id: userId, x_coord: x, y_coord: y, color: userColor};
	    console.log("Coordinate x: " + x, "Coordinate y: " + y);
      return point;
      
	}

  function getCrosshairPosition(canvas: HTMLCanvasElement, point: PlayerCoords): PlayerCoords {
    let x = point.x_coord * canvas.width;
    let y = point.y_coord * canvas.height;
    const scaledPoint: PlayerCoords = {player_id: point.player_id, x_coord: x, y_coord: y, color:point.color};
    return scaledPoint;
  }

  function updateDatabasePlayerPoint(point: PlayerCoords) {
    let request = {
      ...point,
      game_id: gameId
    };
    axios.post(API_BASE_URL + 'coords', request).then((response) => {
      console.log(response);
    }).catch((error) => {
      console.log("error: " + error);
    })
  }

  function setupCanvases(bottomLayer: HTMLCanvasElement, topLayer: HTMLCanvasElement, canvasCard: HTMLElement) {
    console.log("setting up a clear canvas");
    topLayer.addEventListener("mousedown", function (e) {
      const point = getMousePosition(topLayer, e);
      setPlayerPoint(point);
      updateDatabasePlayerPoint(point);
    });
    const context = bottomLayer.getContext('2d');
    const image = new Image();
    image.src = MoodMeter;
    image.onload = () => {
      const ratio = image.width / image.height;
      bottomLayer.width = Math.min(image.width, 0.9 * window.innerWidth);
      bottomLayer.height = bottomLayer.width / ratio;
      topLayer.width = bottomLayer.width;
      topLayer.height = bottomLayer.height;
      topLayer.style.top = "-" + window.getComputedStyle(topLayer, null).getPropertyValue("height");
      canvasCard.style.height = (parseFloat(window.getComputedStyle(topLayer, null).getPropertyValue("height")) + 32) + "px";
      context?.drawImage(image, 0, 0, bottomLayer.width, bottomLayer.height);
    }
  }

  function clearLayer(layer: HTMLCanvasElement) {
    console.log("resetting canvas " + layer.id);
    const context = layer.getContext('2d');
    if (context == null) {
      console.log("layer context is null");
      return;
    }
    console.log("clearing from 0, 0, " + layer.width + ", " + layer.height);
    context.clearRect(0, 0, layer.width, layer.height);
  }

	useEffect(() => {
    // sets up image canvas
    let bottomLayer: HTMLCanvasElement|null= document.querySelector("#layer1");
    let topLayer: HTMLCanvasElement|null = document.querySelector("#layer2");
    let canvasCard: HTMLElement|null = document.querySelector("#canvas-card");
    if (bottomLayer === null || topLayer === null || canvasCard === null) {
      return;
    }
    setupCanvases(bottomLayer, topLayer, canvasCard);

    // get points to draw from API
    axios.get(API_BASE_URL + 'coords?game_id=' + gameId)
      .then((response) => {
        console.log(response);
        let new_points = response.data["Items"].flatMap((item: PlayerCoords) => {
          if (item.player_id === userId) {
            console.log("setting player point to value in database");
            setPlayerPoint({player_id: item.player_id, x_coord: item.x_coord, y_coord: item.y_coord, color: item.color});
            return [];
          } else {
            return item
          }
        });
        console.log("new_points: " + JSON.stringify(new_points));
        setPoints(new_points);
      }).catch((error) => {
        console.log("error: " + error);
      })
	}, []);	

  function clearLocalStorage() {
    localStorage.clear();
    window.location.reload();
  }

  function drawPoint(canvasElem: HTMLCanvasElement, point: PlayerCoords) {
    console.log("drawing point at adjusted-coords " + point.x_coord + ", " + point.y_coord + " in color " + point.color + " on layer " + canvasElem.id);

    // anti-aliasing
    const x = Math.floor(point.x_coord) + 0.5;
    const y = Math.floor(point.y_coord) + 0.5;

    const context = canvasElem.getContext('2d');
    if (context == null) {
      return;
    }

     // draw crosshair at point
     context.beginPath();
     context.moveTo(x, y - CROSSHAIR_SIZE);
     context.lineTo(x, y + CROSSHAIR_SIZE);
     context.moveTo(x - CROSSHAIR_SIZE, y);
     context.lineTo(x + CROSSHAIR_SIZE, y);
     context.lineWidth=5;
     context.strokeStyle = point.color;
     context.stroke();
  }

  // draws points on canvas whenever points or playerPoint states change
  useEffect(() => {
    const bottomLayer: HTMLCanvasElement|null= document.querySelector("#layer1");
    const topLayer: HTMLCanvasElement|null = document.querySelector("#layer2");

    if (bottomLayer == null || topLayer == null) {
      return;
    }
    if (playerPoint !== null) {
      console.log("drawing player point at " + playerPoint.x_coord + ", " + playerPoint.y_coord);
      clearLayer(topLayer);
      const scaledPoint: PlayerCoords = getCrosshairPosition(topLayer, playerPoint);
      drawPoint(topLayer, scaledPoint);
    }
    
    for (let point of points) {
      // convert percentage-based point to pixel-based
      console.log("drawing non-player point at " + point.x_coord + ", " + point.y_coord);
      const scaledPoint: PlayerCoords = getCrosshairPosition(bottomLayer, point);
      drawPoint(bottomLayer, scaledPoint);
    }
  }, [points, playerPoint]);

  function copyGameId() {
    const url = window.location.href.split('?')[0];
    navigator.clipboard.writeText(url + "?game_id=" + gameId);
    window.alert("Copied shareable link to clipboard.");
  }

	return (
    <>
      <h3>Touch the graph to place your mood.</h3>
      <h4>Share this code to invite other players:  <a onClick={copyGameId}><b>{gameId}</b> <img src={Clipboard} /></a></h4>
      <p>Click <a onClick={clearLocalStorage}>here</a> to find a new game</p>
      <div className="card canvas-card" id="canvas-card">
        <canvas id="layer1" className="bottom-layer-canvas"/>
        <canvas id="layer2" className="top-layer-canvas"/>
      </div>
      <PlayerList players={points} />
    </>
		
  )
}

export default Canvas;

