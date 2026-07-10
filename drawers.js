import { ctx, CENTER_X, CENTER_Y, CANVAS_WIDTH, CANVAS_HEIGHT } from './dom.js';
import { state } from './state.js';
import {
  LEVEL_MATRIX,
  CHOICE_CAR_POS,
  CHOICE_TRUCK_POS,
  CHOICE_RADIUS,
  getDirectionsForLevel,
  getPeripheralRadius
} from './config.js';

// --- Background Image Loading ---
const bgImage = new Image();
bgImage.src = 'assets/background.jpg';
let bgLoaded = false;
bgImage.onload = () => {
  bgLoaded = true;
};

const pastureImage = new Image();
pastureImage.src = 'assets/pasture.jpg';
let pastureLoaded = false;
pastureImage.onload = () => {
  pastureLoaded = true;
};

const forestImage = new Image();
forestImage.src = 'assets/forest.jpg';
let forestLoaded = false;
forestImage.onload = () => {
  forestLoaded = true;
};

// --- Custom Route 66 Sign Loader (Flood Fill Transparency) ---
const signImage = new Image();
signImage.src = 'assets/route66.png';
let signLoaded = false;
let processedSignCanvas = null;

signImage.onload = () => {
  const width = signImage.width;
  const height = signImage.height;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const offCtx = offCanvas.getContext('2d');
  offCtx.drawImage(signImage, 0, 0);

  try {
    const imgData = offCtx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    // Flood fill background from the outer borders to make it transparent,
    // leaving the interior of the shield opaque white
    const visited = new Uint8Array(width * height);
    const queue = [];
    
    // Seed border pixels
    for (let x = 0; x < width; x++) {
      queue.push([x, 0], [x, height - 1]);
    }
    for (let y = 0; y < height; y++) {
      queue.push([0, y], [width - 1, y]);
    }
    
    const isWhite = (r, g, b) => r > 215 && g > 215 && b > 215;
    
    let head = 0;
    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      const idx = cy * width + cx;
      if (visited[idx]) continue;
      visited[idx] = 1;
      
      const pIdx = idx * 4;
      if (isWhite(data[pIdx], data[pIdx+1], data[pIdx+2])) {
        data[pIdx+3] = 0; // Transparent alpha
        
        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx]) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    // Crop bounding box of transparent-trimmed image
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let hasContent = false;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasContent = true;
        }
      }
    }
    
    if (hasContent) {
      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx.drawImage(offCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
      processedSignCanvas = cropCanvas;
      signLoaded = true;
    } else {
      processedSignCanvas = signImage;
      signLoaded = true;
    }
  } catch (e) {
    console.warn("Cross-origin restriction or ImageData error on local image. Using raw sign fallback.");
    processedSignCanvas = signImage;
    signLoaded = true;
  }
};

// --- Offscreen TV Static Cache Setup ---
export const NOISE_FRAMES = [];
const NUM_NOISE_FRAMES = 4;
const NOISE_SIZE = 800;
const NOISE_CELL_SIZE = 4;

export function initNoiseFrames() {
  const colors = ['#020617', '#1e293b', '#475569', '#cbd5e1'];
  for (let f = 0; f < NUM_NOISE_FRAMES; f++) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = NOISE_SIZE;
    offCanvas.height = NOISE_SIZE;
    const offCtx = offCanvas.getContext('2d');
    
    const cols = NOISE_SIZE / NOISE_CELL_SIZE;
    const rows = NOISE_SIZE / NOISE_CELL_SIZE;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rand = Math.random();
        let color;
        if (rand < 0.35) {
          color = '#020617';
        } else if (rand < 0.70) {
          color = '#1e293b';
        } else if (rand < 0.90) {
          color = '#475569';
        } else {
          color = '#cbd5e1';
        }
        offCtx.fillStyle = color;
        offCtx.fillRect(c * NOISE_CELL_SIZE, r * NOISE_CELL_SIZE, NOISE_CELL_SIZE, NOISE_CELL_SIZE);
      }
    }
    NOISE_FRAMES.push(offCanvas);
  }
}

export function fillNoiseRect(x, y, w, h) {
  if (NOISE_FRAMES.length === 0) return;

  const timeBlock = Math.floor(performance.now() / 120);
  const frameIndex = timeBlock % NUM_NOISE_FRAMES;

  const offset = frameIndex * 17;
  const sx = Math.max(0, Math.min(NOISE_SIZE - w, Math.floor(Math.abs(x + offset) % (NOISE_SIZE - w))));
  const sy = Math.max(0, Math.min(NOISE_SIZE - h, Math.floor(Math.abs(y + offset) % (NOISE_SIZE - h))));

  ctx.drawImage(NOISE_FRAMES[frameIndex], sx, sy, w, h, x, y, w, h);
}

// --- Procedural Canvas Rendering Drawers ---

export function drawVehicle(type, x, y, scale = 1, hasHoverGlow = false) {
  const drawer = VEHICLE_DRAWERS[type];
  if (drawer) {
    drawer(x, y, scale, hasHoverGlow);
  } else {
    drawVehicleCoupe(x, y, scale, hasHoverGlow);
  }
}

function formatVehicleName(type) {
  switch (type) {
    case 'convertible': return 'Convertible';
    case 'panel_van': return 'Panel Van';
    case 'pickup': return 'Pickup';
    case 'coupe': return 'Coupe';
    case 'roadster': return 'Roadster';
    case 'wagon': return 'Station Wagon';
    case 'pickup_rails': return 'Pickup (Rails)';
    case 'coupe_rack': return 'Coupe (Rack)';
    default: return 'Vehicle';
  }
}

function setGlow(hasHoverGlow) {
  if (hasHoverGlow) {
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
  } else {
    ctx.shadowColor = '#1e272e';
    ctx.shadowBlur = 4;
  }
}

function drawWheelsAndLights() {
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2f3542';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(-20, 8, 8, 0, Math.PI * 2);
  ctx.arc(20, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#dcdde1';
  ctx.beginPath();
  ctx.arc(-20, 8, 3, 0, Math.PI * 2);
  ctx.arc(20, 8, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(31, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(-31, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawVehicleCoupe(x, y, scale = 1, hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setGlow(hasHoverGlow);

  ctx.fillStyle = '#4b6584';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(-35, 5);
  ctx.lineTo(-30, -5);
  ctx.quadraticCurveTo(-15, -6, 0, -6);
  ctx.quadraticCurveTo(15, -6, 30, -5);
  ctx.lineTo(35, 5);
  ctx.lineTo(30, 8);
  ctx.lineTo(-30, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-20, -5);
  ctx.lineTo(-12, -18);
  ctx.quadraticCurveTo(0, -22, 12, -18);
  ctx.lineTo(20, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.lineTo(-10, -15);
  ctx.lineTo(-1, -15);
  ctx.lineTo(-1, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(1, -6);
  ctx.lineTo(1, -15);
  ctx.lineTo(10, -15);
  ctx.lineTo(16, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawWheelsAndLights();
  ctx.restore();
}

function drawVehicleCoupeB(x, y, scale = 1, hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setGlow(hasHoverGlow);

  ctx.fillStyle = '#4b6584';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(-35, 5);
  ctx.lineTo(-30, -5);
  ctx.quadraticCurveTo(-15, -6, 0, -6);
  ctx.quadraticCurveTo(15, -6, 30, -5);
  ctx.lineTo(35, 5);
  ctx.lineTo(30, 8);
  ctx.lineTo(-30, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-20, -5);
  ctx.lineTo(-12, -18);
  ctx.quadraticCurveTo(0, -22, 12, -18);
  ctx.lineTo(20, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.lineTo(-10, -15);
  ctx.lineTo(-1, -15);
  ctx.lineTo(-1, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(1, -6);
  ctx.lineTo(1, -15);
  ctx.lineTo(10, -15);
  ctx.lineTo(16, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2f3542';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(-12, -23, 24, 5);
  ctx.fill();
  ctx.stroke();

  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-8, -18);
  ctx.lineTo(-8, -20);
  ctx.moveTo(8, -18);
  ctx.lineTo(8, -20);
  ctx.stroke();

  drawWheelsAndLights();
  ctx.restore();
}

function drawVehicleConvertible(x, y, scale = 1, hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setGlow(hasHoverGlow);

  ctx.fillStyle = '#4b6584';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(-35, 5);
  ctx.lineTo(-31, -5);
  ctx.lineTo(-12, -5);
  ctx.lineTo(-10, -15);
  ctx.lineTo(6, -15);
  ctx.lineTo(10, -5);
  ctx.lineTo(30, -5);
  ctx.lineTo(35, 5);
  ctx.lineTo(30, 8);
  ctx.lineTo(-30, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-22, -8, 7, 4, Math.PI / 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#1e272e';
  ctx.beginPath();
  ctx.moveTo(6, -15);
  ctx.lineTo(10, -5);
  ctx.stroke();

  drawWheelsAndLights();
  ctx.restore();
}

function drawVehicleRoadster(x, y, scale = 1, hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setGlow(hasHoverGlow);

  ctx.fillStyle = '#4b6584';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(-35, 5);
  ctx.lineTo(-33, 0);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-8, -14);
  ctx.lineTo(4, -14);
  ctx.lineTo(8, 0);
  ctx.lineTo(31, 0);
  ctx.lineTo(35, 5);
  ctx.lineTo(30, 8);
  ctx.lineTo(-30, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawWheelsAndLights();
  ctx.restore();
}

function drawVehiclePanelVan(x, y, scale = 1, hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setGlow(hasHoverGlow);

  ctx.fillStyle = '#4b6584';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(-35, 5);
  ctx.lineTo(-35, -16);
  ctx.lineTo(10, -16);
  ctx.lineTo(21, -4);
  ctx.lineTo(34, -4);
  ctx.lineTo(35, 5);
  ctx.lineTo(30, 8);
  ctx.lineTo(-30, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.rect(-34, -17, 43, 3.5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(11, -12);
  ctx.lineTo(18, -5);
  ctx.lineTo(9, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawWheelsAndLights();
  ctx.restore();
}

function drawVehiclePickup(x, y, scale = 1, hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setGlow(hasHoverGlow);

  ctx.fillStyle = '#4b6584';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(7, 5);
  ctx.lineTo(7, -13);
  ctx.lineTo(24, -13);
  ctx.quadraticCurveTo(32, -13, 34, -3);
  ctx.lineTo(34, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(-35, -2, 42, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(13, -10);
  ctx.lineTo(23, -10);
  ctx.quadraticCurveTo(28, -10, 29, -4);
  ctx.lineTo(13, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(7, -14, 18, 3);

  drawWheelsAndLights();
  ctx.restore();
}

function drawVehiclePickupRails(x, y, scale = 1, hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setGlow(hasHoverGlow);

  ctx.fillStyle = '#4b6584';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(7, 5);
  ctx.lineTo(7, -13);
  ctx.lineTo(24, -13);
  ctx.quadraticCurveTo(32, -13, 34, -3);
  ctx.lineTo(34, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(-35, -2, 42, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(13, -10);
  ctx.lineTo(23, -10);
  ctx.quadraticCurveTo(28, -10, 29, -4);
  ctx.lineTo(13, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(7, -14, 18, 3);

  ctx.strokeStyle = '#8c593b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-31, -2); ctx.lineTo(-31, -11);
  ctx.moveTo(-18, -2); ctx.lineTo(-18, -11);
  ctx.moveTo(-5, -2);  ctx.lineTo(-5, -11);
  ctx.moveTo(-35, -7); ctx.lineTo(7, -7);
  ctx.moveTo(-35, -11); ctx.lineTo(7, -11);
  ctx.stroke();

  drawWheelsAndLights();
  ctx.restore();
}

function drawVehicleStationWagon(x, y, scale = 1, hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setGlow(hasHoverGlow);

  ctx.fillStyle = '#4b6584';
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(7, 5);
  ctx.lineTo(7, -13);
  ctx.lineTo(24, -13);
  ctx.quadraticCurveTo(32, -13, 34, -3);
  ctx.lineTo(34, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(-35, -13, 42, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#b87c56';
  ctx.fillRect(-33, -11, 38, 14);

  ctx.strokeStyle = '#8c593b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(-33, -11, 38, 14);
  ctx.moveTo(-33, -7); ctx.lineTo(5, -7);
  ctx.moveTo(-33, -2); ctx.lineTo(5, -2);
  ctx.moveTo(-20, -11); ctx.lineTo(-20, 3);
  ctx.moveTo(-7, -11); ctx.lineTo(-7, 3);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(13, -10);
  ctx.lineTo(23, -10);
  ctx.quadraticCurveTo(28, -10, 29, -4);
  ctx.lineTo(13, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-34, -14, 59, 2.5);

  drawWheelsAndLights();
  ctx.restore();
}

const VEHICLE_DRAWERS = {
  'coupe': drawVehicleCoupe,
  'coupe_rack': drawVehicleCoupeB,
  'convertible': drawVehicleConvertible,
  'roadster': drawVehicleRoadster,
  'panel_van': drawVehiclePanelVan,
  'pickup': drawVehiclePickup,
  'pickup_rails': drawVehiclePickupRails,
  'wagon': drawVehicleStationWagon
};

export function drawRoadSign(x, y, scale = 1, isActive = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (isActive) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 10;
  }

  if (signLoaded && processedSignCanvas) {
    const drawHeight = 68;
    const drawWidth = drawHeight * (processedSignCanvas.width / processedSignCanvas.height);
    ctx.drawImage(processedSignCanvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } else {
    // Canvas Fallback yellow warning diamond
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(22, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawDecoySign(x, y, scale = 1, type = 'triangle') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * 0.95, scale * 0.95);
  ctx.lineWidth = 3.5;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 5;

  if (type === 'horse_xing') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(22, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('XING', 0, -10);

    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(5, 0);
    ctx.lineTo(7, -5);
    ctx.stroke();
    
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(6, 7);
    ctx.moveTo(-6, 2);
    ctx.lineTo(-7, 7);
    ctx.moveTo(-1, -1);
    ctx.lineTo(-1, 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-1, -3, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'triangle') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-20, 15);
    ctx.lineTo(20, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'box') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2980b9';
    ctx.beginPath();
    ctx.rect(-18, -18, 36, 36);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'diamond') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(20, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawNoiseMask() {
  drawProceduralBackground();

  ctx.save();
  ctx.beginPath();
  const rx = CENTER_X - 110;
  const ry = CENTER_Y - 65;
  const rw = 220;
  const rh = 130;
  const radius = 18;
  ctx.moveTo(rx + radius, ry);
  ctx.lineTo(rx + rw - radius, ry);
  ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
  ctx.lineTo(rx + rw, ry + rh - radius);
  ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
  ctx.lineTo(rx + radius, ry + rh);
  ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
  ctx.lineTo(rx, ry + radius);
  ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
  ctx.closePath();
  ctx.clip();
  
  fillNoiseRect(rx, ry, rw, rh);
  ctx.restore();

  const currentRadius = getPeripheralRadius();
  const dirs = getDirectionsForLevel();
  dirs.forEach(dir => {
    const px = CENTER_X + currentRadius * Math.cos(dir.angle);
    const py = CENTER_Y + currentRadius * Math.sin(dir.angle);

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 40, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    fillNoiseRect(px - 40, py - 40, 80, 80);
    ctx.restore();
  });
}

export function drawFixation() {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(CENTER_X - 15, CENTER_Y);
  ctx.lineTo(CENTER_X + 15, CENTER_Y);
  ctx.moveTo(CENTER_X, CENTER_Y - 15);
  ctx.lineTo(CENTER_X, CENTER_Y + 15);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, 15, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawRoadSectors() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;

  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  const count = currentLevel.axes || 8;
  const dirs = getDirectionsForLevel();

  dirs.forEach(dir => {
    const boundaryAngle = dir.angle - Math.PI / count;
    ctx.beginPath();
    ctx.moveTo(CENTER_X, CENTER_Y);
    ctx.lineTo(
      CENTER_X + 900 * Math.cos(boundaryAngle),
      CENTER_Y + 900 * Math.sin(boundaryAngle)
    );
    ctx.stroke();
  });
  
  ctx.restore();
}

export function drawVisualCrowdingGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 1.0;
  
  for (let r = 50; r < 500; r += 50) {
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  for (let a = 0; a < 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(CENTER_X, CENTER_Y);
    ctx.lineTo(CENTER_X + 900 * Math.cos(rad), CENTER_Y + 900 * Math.sin(rad));
    ctx.stroke();
  }
  
  ctx.restore();
}

export function drawSectorHighlight(index, color) {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  const count = currentLevel.axes || 8;
  const dirs = getDirectionsForLevel();
  const dir = dirs[index];
  if (!dir) return;

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(CENTER_X, CENTER_Y);

  const startAngle = dir.angle - Math.PI / count;
  const endAngle = dir.angle + Math.PI / count;

  ctx.arc(CENTER_X, CENTER_Y, 800, startAngle, endAngle);
  ctx.lineTo(CENTER_X, CENTER_Y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawCentralChoiceCards() {
  const isCarHovered = (state.hoveredCenterChoice === 'car');
  const carScale = isCarHovered ? 1.45 : 1.25;

  const isTruckHovered = (state.hoveredCenterChoice === 'truck');
  const truckScale = isTruckHovered ? 1.45 : 1.25;

  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  drawVehicle(currentLevel.vehicleA, CHOICE_CAR_POS.x, CHOICE_CAR_POS.y, carScale, isCarHovered);
  drawVehicle(currentLevel.vehicleB, CHOICE_TRUCK_POS.x, CHOICE_TRUCK_POS.y, truckScale, isTruckHovered);
}

export function drawFeedback() {
  const isPeriphCorrect = (state.userPeriphChoice === state.stimulusAngleIndex);
  drawSectorHighlight(state.stimulusAngleIndex, 'rgba(16, 185, 129, 0.18)');

  if (!isPeriphCorrect && state.userPeriphChoice !== null) {
    drawSectorHighlight(state.userPeriphChoice, 'rgba(244, 63, 94, 0.18)');
  }

  const dirs = getDirectionsForLevel();
  const dir = dirs[state.stimulusAngleIndex];
  if (dir) {
    const px = CENTER_X + getPeripheralRadius() * Math.cos(dir.angle);
    const py = CENTER_Y + getPeripheralRadius() * Math.sin(dir.angle);
    drawRoadSign(px, py, 1.1, true);
  }

  const isCenterCorrect = (state.userCenterChoice === state.stimulusCenter);
  
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.strokeStyle = isCenterCorrect ? '#10b981' : '#f43f5e';
  ctx.lineWidth = 3;
  ctx.shadowColor = isCenterCorrect ? '#10b981' : '#f43f5e';
  ctx.shadowBlur = 10;
  
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  drawVehicle(state.stimulusCenter, CENTER_X, CENTER_Y - 5, 1.35, false);

  ctx.fillStyle = isCenterCorrect ? '#10b981' : '#f43f5e';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (isCenterCorrect) {
    ctx.fillText('✓ CORRECT', CENTER_X, CENTER_Y + 50);
  } else {
    ctx.fillText('✗ INCORRECT', CENTER_X, CENTER_Y + 50);
  }
  ctx.restore();
}

export function drawProceduralBackground() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  
  if (currentLevel.background === 'DESERT') {
    if (bgLoaded) {
      ctx.drawImage(bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(11, 15, 25, 0.40)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CENTER_Y);
      skyGrad.addColorStop(0, '#f39c12');
      skyGrad.addColorStop(1, '#e74c3c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CENTER_Y);

      const groundGrad = ctx.createLinearGradient(0, CENTER_Y, 0, CANVAS_HEIGHT);
      groundGrad.addColorStop(0, '#d35400');
      groundGrad.addColorStop(1, '#a04000');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, CENTER_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  } else if (currentLevel.background === 'FARMLAND') {
    if (pastureLoaded) {
      ctx.drawImage(pastureImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(11, 15, 25, 0.20)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CENTER_Y);
      skyGrad.addColorStop(0, '#7ed6df');
      skyGrad.addColorStop(1, '#eccc68');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#2ed573';
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT);
      ctx.quadraticCurveTo(CANVAS_WIDTH * 0.25, CENTER_Y + 50, CANVAS_WIDTH * 0.5, CENTER_Y + 120);
      ctx.quadraticCurveTo(CANVAS_WIDTH * 0.75, CENTER_Y + 180, CANVAS_WIDTH, CENTER_Y + 100);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#26af5f';
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT);
      ctx.quadraticCurveTo(CANVAS_WIDTH * 0.35, CENTER_Y + 180, CANVAS_WIDTH * 0.7, CENTER_Y + 140);
      ctx.quadraticCurveTo(CANVAS_WIDTH * 0.85, CENTER_Y + 100, CANVAS_WIDTH, CENTER_Y + 160);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    if (forestLoaded) {
      ctx.drawImage(forestImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(11, 15, 25, 0.40)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CENTER_Y);
      skyGrad.addColorStop(0, '#130f40');
      skyGrad.addColorStop(1, '#30336b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT);
      ctx.lineTo(0, CENTER_Y + 180);
      for (let x = 0; x < CANVAS_WIDTH; x += 30) {
        ctx.lineTo(x + 15, CENTER_Y + 120 + Math.sin(x) * 15);
        ctx.lineTo(x + 30, CENTER_Y + 180);
      }
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export function draw() {
  if (state.currentPhase !== 'MASK') {
    drawProceduralBackground();
  }

  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  if (state.currentPhase !== 'MASK' && currentLevel.background === 'FOREST') {
    drawVisualCrowdingGrid();
  }

  switch (state.currentPhase) {
    case 'IDLE':
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, 28, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'FIXATION':
      drawFixation();
      break;

    case 'STIMULUS':
      drawVehicle(state.stimulusCenter, CENTER_X, CENTER_Y, 1.0, false);

      const dirs = getDirectionsForLevel();
      const dir = dirs[state.stimulusAngleIndex];
      if (dir) {
        const px = CENTER_X + getPeripheralRadius() * Math.cos(dir.angle);
        const py = CENTER_Y + getPeripheralRadius() * Math.sin(dir.angle);
        drawRoadSign(px, py, 1.0, true);
      }

      state.decoys.forEach(decoy => {
        const decoyDir = dirs[decoy.angleIndex];
        if (decoyDir) {
          const dx = CENTER_X + decoy.radius * Math.cos(decoyDir.angle);
          const dy = CENTER_Y + decoy.radius * Math.sin(decoyDir.angle);
          drawDecoySign(dx, dy, 1.0, decoy.type);
        }
      });
      break;

    case 'MASK':
      drawNoiseMask();
      break;

    case 'RESP_CENTRAL':
      drawCentralChoiceCards();
      break;

    case 'RESP_PERIPH':
      if (state.hoveredSectorIndex !== null) {
        drawSectorHighlight(state.hoveredSectorIndex, 'rgba(255, 255, 255, 0.08)');
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, 35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Where did the Route 66 sign appear?', CENTER_X, CENTER_Y - 140);
      ctx.restore();
      break;

    case 'FEEDBACK':
      drawFeedback();
      break;

    case 'GAMEOVER':
      break;
  }
}
