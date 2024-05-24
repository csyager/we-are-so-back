import { useState, useEffect } from 'react'
import axios from 'axios';

import MoodMeter from '../assets/mood_meter.jpg'
import { API_BASE_URL, CROSSHAIR_SIZE } from '../Constants';
import PlayerCoords from '../dao/PlayerCoords';

interface Point {
  x: number;
  y: number;
}

function Canvas() {
  const [points, setPoints] = useState<Array<Point>>([]);
  const [playerPoint, setPlayerPoint] = useState<Point|null>(null);

	function getMousePosition(canvas: any, event: any): Point {
	    let rect = canvas.getBoundingClientRect();
      const rectWidth = rect.right - rect.left;
      const rectHeight = rect.bottom - rect.top;
	    let x = (event.clientX - rect.left) / rectWidth;
	    let y = (event.clientY - rect.top) / rectHeight;
      const point: Point = {x: x, y: y};
	    console.log("Coordinate x: " + x, "Coordinate y: " + y);
      return point;
      
	}

  function getCrosshairPosition(canvas: HTMLCanvasElement, point: Point): Point {
    let x = point.x * canvas.width;
    let y = point.y * canvas.height;
    const scaledPoint: Point = {x: x, y: y};
    return scaledPoint;
  }

  function setupCanvases(bottomLayer: HTMLCanvasElement, topLayer: HTMLCanvasElement, canvasCard: HTMLElement) {
    console.log("setting up a clear canvas");
    topLayer.addEventListener("mousedown", function (e) {
      const point = getMousePosition(topLayer, e);
      setPlayerPoint(point);
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
      canvasCard.style.height = (parseFloat(window.getComputedStyle(topLayer, null).getPropertyValue("height")) + 60) + "px";
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
    axios.get(API_BASE_URL + 'coords?game_id=' + localStorage.getItem('gameId'))
      .then((response) => {
        console.log(response);
        let new_points = response.data["Items"].map((item: PlayerCoords) => {
          console.log("item: " + item);
          if (item.player_id === localStorage.getItem("player_id")) {
            console.log("setting player point to value in database");
            setPlayerPoint({x: item.x_coord, y: item.y_coord});
          } else {
            return {x: item.x_coord, y: item.y_coord}
          }
        });
        setPoints(new_points);
      }).catch((error) => {
        console.log("error: " + error);
      })
	}, []);	

  function clearLocalStorage() {
    localStorage.clear();
    window.location.reload();
  }

  function drawPoint(canvasElem: HTMLCanvasElement, point: Point) {
    console.log("drawing point at adjusted-coords " + point.x + ", " + point.y);
    // convert percentage-based point to pixel-based

    // anti-aliasing
    const x = Math.floor(point.x) + 0.5;
    const y = Math.floor(point.y) + 0.5;

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
     context.lineWidth=3;
     context.strokeStyle = 'black';
     context.stroke();
  }

  // draws points on canvas whenever points or playerPoint states change
  useEffect(() => {
    const bottomLayer: HTMLCanvasElement|null= document.querySelector("#layer1");
    const topLayer: HTMLCanvasElement|null = document.querySelector("#layer2");

    if (bottomLayer == null || topLayer == null) {
      return;
    }
    if (playerPoint) {
      console.log("drawing player point at " + playerPoint.x + ", " + playerPoint.y);
      clearLayer(topLayer);
      const scaledPoint: Point = getCrosshairPosition(topLayer, playerPoint);
      drawPoint(topLayer, scaledPoint);
    }
    
    for (let point of points) {
      // convert percentage-based point to pixel-based
      const scaledPoint: Point = getCrosshairPosition(bottomLayer, point);
      drawPoint(bottomLayer, scaledPoint);
    }
  }, [points, playerPoint]);

	return (
    <>
      <h3>Touch the graph to place your mood.</h3>
      <p>Click <a onClick={clearLocalStorage}>here</a> to find a new game</p>
      <div className="card" id="canvas-card">
        <canvas id="layer1" className="bottom-layer-canvas"/>
        <canvas id="layer2" className="top-layer-canvas"/>
      </div>
    </>
		
  )
}

export default Canvas;

