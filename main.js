// --- Campaign Level Matrix Configuration ---
const LEVEL_MATRIX = [
  // STAGE 1 (Desert scenery, highly distinct vehicle body types Sedan vs Truck, 0 distractors, 8 radial axes)
  { level: 1, stage: 1, name: "Desert Novice 1", background: "DESERT", similarity: "EASY", distance: "CLOSE", distractors: 0, axes: 8 },
  { level: 2, stage: 1, name: "Desert Novice 2", background: "DESERT", similarity: "EASY", distance: "MID",   distractors: 0, axes: 8 },
  { level: 3, stage: 1, name: "Desert Novice 3", background: "DESERT", similarity: "EASY", distance: "FAR",   distractors: 0, axes: 8 },
  { level: 4, stage: 1, name: "Desert Intermediate 1", background: "DESERT", similarity: "EASY", distance: "MID", distractors: 0, axes: 8 },
  { level: 5, stage: 1, name: "Desert Intermediate 2", background: "DESERT", similarity: "EASY", distance: "FAR", distractors: 0, axes: 8 },

  // STAGE 2 (Farmland rolling pasture hills, same body type Sedan but different colors Blue vs Red, up to 23 distractors, 8 radial axes)
  { level: 6, stage: 2, name: "Pasture Scout 1", background: "FARMLAND", similarity: "MID", distance: "CLOSE", distractors: 6, axes: 8 },
  { level: 7, stage: 2, name: "Pasture Scout 2", background: "FARMLAND", similarity: "MID", distance: "MID",   distractors: 12, axes: 8 },
  { level: 8, stage: 2, name: "Pasture Challenger 1", background: "FARMLAND", similarity: "MID", distance: "FAR",   distractors: 16, axes: 8 },
  { level: 9, stage: 2, name: "Pasture Challenger 2", background: "FARMLAND", similarity: "MID", distance: "MID",   distractors: 20, axes: 8 },
  { level: 10, stage: 2, name: "Pasture Master", background: "FARMLAND", similarity: "MID", distance: "FAR",   distractors: 23, axes: 8 },

  // STAGE 3 (Forest silhouettes, identical body shapes with minute roof cargo rack change, up to 47 distractors, 16 radial axes)
  { level: 11, stage: 3, name: "Forest Elite 1", background: "FOREST", similarity: "HARD", distance: "CLOSE", distractors: 15, axes: 16 },
  { level: 12, stage: 3, name: "Forest Elite 2", background: "FOREST", similarity: "HARD", distance: "MID",   distractors: 25, axes: 16 },
  { level: 13, stage: 3, name: "Forest Master 1", background: "FOREST", similarity: "HARD", distance: "FAR",   distractors: 35, axes: 16 },
  { level: 14, stage: 3, name: "Forest Master 2", background: "FOREST", similarity: "HARD", distance: "MID",   distractors: 43, axes: 16 },
  { level: 15, stage: 3, name: "UFOV Grandmaster", background: "FOREST", similarity: "HARD", distance: "FAR",   distractors: 47, axes: 16 }
];

// --- Game State Variables ---
const state = {
  currentPhase: 'IDLE', // IDLE, FIXATION, STIMULUS, MASK, RESP_CENTRAL, RESP_PERIPH, FEEDBACK, GAMEOVER
  flashDuration: 500,   // Current stimulus flash time in ms (starts at 500ms for each level)
  startingSpeed: 500,   // Level-start speed in ms
  trialNumber: 0,       // Current trial count inside the level
  maxTrials: 20,        // Total trials per level (editable via Session Length)
  soundEnabled: true,   // Sound toggle
  showGrid: false,      // Guidelines hidden by default (only visible on hover highlights)

  // Level Progression State
  currentLevelIndex: 0, // 0 to 14, saved to localStorage
  correctStreak: 0,     // Consecutive correct counter (for Two-Down staircase)

  // Stimulus details for current trial
  stimulusCenter: 'car', // 'car', 'minivan', 'car_rack', or 'truck'
  stimulusAngleIndex: 0, // Index in the dynamic directions array

  // Dynamic coordinates
  centralSimilarity: 'EASY',     // EASY, MID, HARD
  peripheralDistance: 'CLOSE',   // CLOSE, MID, FAR
  distractorCount: 0,            // Decoy count limit
  backgroundComplexity: 'DESERT', // DESERT, FARMLAND, FOREST
  decoys: [],                    // Distractor coordinates: [{ angleIndex, radius, type }]

  // User inputs
  userCenterChoice: null, // Left vehicle choice, Right vehicle choice
  userPeriphChoice: null, // Sector angle index chosen

  // Interactive Hovering States
  hoveredCenterChoice: null, // 'car', 'truck' (maps to Choice B)
  hoveredSectorIndex: null,  // Index in dynamic directions array

  // Performance tracking for current level run
  score: 0,
  speedHistory: [],
  trialResults: [],

  // High score tracking
  highScores: [],

  // Debug options overrides
  speedLocked: false,
  lockedSpeedVal: 500,
  enableMaskPhase: true,
  freezeStimulusPhase: false,

  // Timing
  phaseStartTime: 0
};

// --- Game Viewport Constants ---
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 720;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

// Concentric target radii
const RADIUS_CLOSE = 150;
const RADIUS_MID = 240;
const RADIUS_FAR = 320;

// Central Choice Coordinates (positioned below the center vehicle area)
const CHOICE_CAR_POS = { x: CENTER_X - 140, y: CENTER_Y + 140 };
const CHOICE_TRUCK_POS = { x: CENTER_X + 140, y: CENTER_Y + 140 };
const CHOICE_RADIUS = 80;

// --- DOM References ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnNextLevel = document.getElementById('btn-next-level');

const toggleSound = document.getElementById('toggle-sound');
const toggleSoundDot = document.getElementById('toggle-sound-dot');
const btnResetCampaign = document.getElementById('btn-reset-campaign');
const btnResetLeaderboard = document.getElementById('btn-reset-leaderboard');

const sliderTrials = document.getElementById('slider-trials');
const trialsVal = document.getElementById('trials-val');

const hudSpeedVal = document.getElementById('hud-speed-val');
const hudSpeedBar = document.getElementById('hud-speed-bar');
const hudScore = document.getElementById('hud-score');
const hudStreak = document.getElementById('hud-streak');
const hudMultiplier = document.getElementById('hud-multiplier');
const hudProgressText = document.getElementById('hud-progress-text');
const hudDotsContainer = document.getElementById('hud-dots');

const headerHighScore = document.getElementById('header-high-score');
const headerSpeedStatus = document.getElementById('header-speed-status');
const leaderboardList = document.getElementById('leaderboard-list');

const goFinalSpeed = document.getElementById('go-final-speed');
const goBestSpeed = document.getElementById('go-best-speed');
const goAccuracy = document.getElementById('go-accuracy');
const goPoints = document.getElementById('go-points');
const goChart = document.getElementById('go-chart');

// Debug Tools DOM References
const dbLevelSelect = document.getElementById('db-level-select');
const dbLockSpeed = document.getElementById('db-lock-speed');
const dbSpeedSlider = document.getElementById('db-speed-slider');
const dbSpeedVal = document.getElementById('db-speed-val');
const dbEnableMask = document.getElementById('db-enable-mask');
const dbFreezeStimulus = document.getElementById('db-freeze-stimulus');

const dbMetricLevel = document.getElementById('db-metric-level');
const dbMetricDistractors = document.getElementById('db-metric-distractors');
const dbMetricSpeed = document.getElementById('db-metric-speed');
const dbMetricStreak = document.getElementById('db-metric-streak');
const dbMetricSimilarity = document.getElementById('db-metric-similarity');
const dbMetricAxes = document.getElementById('db-metric-axes');

// Mouse tracking
let mouseX = 0;
let mouseY = 0;

// --- Background Image Loading ---
const bgImage = new Image();
bgImage.src = 'background.jpg';
let bgLoaded = false;
bgImage.onload = () => {
  bgLoaded = true;
};

const pastureImage = new Image();
pastureImage.src = 'pasture.jpg';
let pastureLoaded = false;
pastureImage.onload = () => {
  pastureLoaded = true;
};

const forestImage = new Image();
forestImage.src = 'forest.jpg';
let forestLoaded = false;
forestImage.onload = () => {
  forestLoaded = true;
};

// --- Custom Route 66 Sign Loader (Flood Fill Transparency) ---
const signImage = new Image();
signImage.src = 'route66.png';
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
        const idx = (y * width + x) * 4;
        if (data[idx+3] > 0) {
          hasContent = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (hasContent) {
      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const croppedCtx = croppedCanvas.getContext('2d');
      
      croppedCtx.drawImage(offCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
      processedSignCanvas = croppedCanvas;
    } else {
      processedSignCanvas = offCanvas;
    }
    signLoaded = true;
  } catch (e) {
    console.error("Route 66 transparency processing failed (CORS/Fallback):", e);
    processedSignCanvas = signImage;
    signLoaded = true;
  }
};

// --- Dynamic Directions (8 or 16 Spokes) ---
function getDirectionsForLevel() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  const count = currentLevel.axes || 8;
  const dirs = [];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    dirs.push({ index: i, angle: angle });
  }
  return dirs;
}

// --- Helper: Get Peripheral Target Radius ---
function getPeripheralRadius() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  if (currentLevel.distance === 'CLOSE') return RADIUS_CLOSE;
  if (currentLevel.distance === 'MID') return RADIUS_MID;
  return RADIUS_FAR;
}

// --- Web Audio Synthesizer Beeps ---
let audioCtx = null;

function playSound(type) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'failure') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.3);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    console.error("Audio playback error:", e);
  }
}

// --- Procedural Canvas Rendering Drawers ---

// Draw a vintage-style blue-gray or custom colored car
function drawCar(x, y, scale = 1, color = '#4b6584', strokeColor = '#1e272e', hasHoverGlow = false, hasRoofRack = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (hasHoverGlow) {
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
  } else {
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 4;
  }

  // Car chassis bottom
  ctx.fillStyle = color;
  ctx.strokeStyle = strokeColor;
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

  // Cabin
  ctx.beginPath();
  ctx.moveTo(-20, -5);
  ctx.lineTo(-12, -18);
  ctx.quadraticCurveTo(0, -22, 12, -18);
  ctx.lineTo(20, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Windows
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

  // Roof luggage rack (cargo box) for fine discrimination (Stage 3)
  if (hasRoofRack) {
    ctx.fillStyle = '#2f3542';
    ctx.strokeStyle = strokeColor;
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
  }

  // Wheels
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2f3542';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;

  // Front wheel
  ctx.beginPath();
  ctx.arc(-20, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Rear wheel
  ctx.beginPath();
  ctx.arc(20, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wheel hubs (chrome)
  ctx.fillStyle = '#dcdde1';
  ctx.beginPath();
  ctx.arc(-20, 8, 3, 0, Math.PI * 2);
  ctx.arc(20, 8, 3, 0, Math.PI * 2);
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(31, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Taillights
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(-31, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw a vintage-style blue-gray flatbed pickup truck
function drawTruck(x, y, scale = 1, color = '#57606f', strokeColor = '#1e272e', hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (hasHoverGlow) {
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
  } else {
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 4;
  }

  ctx.fillStyle = color;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;

  // Cargo Bed (Rectangle block)
  ctx.beginPath();
  ctx.rect(-35, -18, 42, 23);
  ctx.fill();
  ctx.stroke();

  // Cabin
  ctx.beginPath();
  ctx.moveTo(7, 5);
  ctx.lineTo(7, -13);
  ctx.lineTo(24, -13);
  ctx.quadraticCurveTo(32, -13, 34, -3);
  ctx.lineTo(34, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cabin Window
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(13, -10);
  ctx.lineTo(23, -10);
  ctx.quadraticCurveTo(28, -10, 29, -4);
  ctx.lineTo(13, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bottom chassis connector
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(-32, 5, 62, 4);

  // Wheels
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2f3542';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;

  // Front wheel
  ctx.beginPath();
  ctx.arc(22, 9, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rear wheels (dual axel)
  ctx.beginPath();
  ctx.arc(-14, 9, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-26, 9, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wheel Hubs
  ctx.fillStyle = '#dcdde1';
  ctx.beginPath();
  ctx.arc(22, 9, 3, 0, Math.PI * 2);
  ctx.arc(-14, 9, 3, 0, Math.PI * 2);
  ctx.arc(-26, 9, 3, 0, Math.PI * 2);
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(33, 1, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw a flat-backed Minivan/SUV silhouette matching the car's color/accents
function drawMinivan(x, y, scale = 1, color = '#4b6584', strokeColor = '#1e272e', hasHoverGlow = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (hasHoverGlow) {
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
  } else {
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 4;
  }

  ctx.fillStyle = color;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;

  // Minivan chassis/cabin (flat-backed silhouette)
  ctx.beginPath();
  ctx.moveTo(-35, 6);
  ctx.lineTo(-35, -4);    // Lower flat back
  ctx.lineTo(-32, -15);   // Upper flat back
  ctx.lineTo(8, -15);     // Horizontal roofline
  ctx.lineTo(21, -4);     // Windshield slope
  ctx.lineTo(34, -4);     // Hood line
  ctx.lineTo(35, 6);
  ctx.lineTo(32, 9);
  ctx.lineTo(-32, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Windows
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-30, -12);
  ctx.lineTo(-14, -12);
  ctx.lineTo(-14, -4);
  ctx.lineTo(-30, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-11, -12);
  ctx.lineTo(5, -12);
  ctx.lineTo(5, -4);
  ctx.lineTo(-11, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(8, -12);
  ctx.lineTo(18, -4);
  ctx.lineTo(8, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wheels
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2f3542';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;

  // Front wheel
  ctx.beginPath();
  ctx.arc(18, 9, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rear wheel
  ctx.beginPath();
  ctx.arc(-18, 9, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wheel hubs (chrome accents)
  ctx.fillStyle = '#dcdde1';
  ctx.beginPath();
  ctx.arc(18, 9, 3, 0, Math.PI * 2);
  ctx.arc(-18, 9, 3, 0, Math.PI * 2);
  ctx.fill();

  // Headlight
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(33, 1, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Taillight
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(-33, 1, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw the Route 66 Shield Sign from the user image
function drawRoadSign(x, y, scale = 1, isActive = true) {
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
    // Procedural fallback warning shield
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-18, -20);
    ctx.bezierCurveTo(-10, -22, -5, -17, 0, -17);
    ctx.bezierCurveTo(5, -17, 10, -22, 18, -20);
    ctx.bezierCurveTo(20, -5, 18, 9, 0, 22);
    ctx.bezierCurveTo(-18, 9, -20, -5, -18, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// Draw decoy/distractor road signs (hollow shapes to partially/fully crowd the peripheral UFOV)
function drawDecoySign(x, y, scale = 1, type = 'triangle') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * 0.95, scale * 0.95);
  ctx.lineWidth = 3.5;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 5;

  if (type === 'horse_xing') {
    // White background warning diamond
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

    // Thin inner black boundary line
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.stroke();

    // Draw stylized Horse + Rider Silhouette
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // "XING" text
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('XING', 0, -10);

    // Vector drawing for the horse
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Horse body
    ctx.moveTo(-6, 2);
    ctx.lineTo(5, 0);
    // Neck
    ctx.lineTo(7, -5);
    ctx.stroke();
    
    // Legs
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // Front leg
    ctx.moveTo(5, 0);
    ctx.lineTo(6, 7);
    // Rear leg
    ctx.moveTo(-6, 2);
    ctx.lineTo(-7, 7);
    // Rider body
    ctx.moveTo(-1, -1);
    ctx.lineTo(-1, 2);
    ctx.stroke();

    // Rider head
    ctx.beginPath();
    ctx.arc(-1, -3, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'triangle') {
    // Red outline warning triangle
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
    // Blue outline square box
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2980b9';
    ctx.beginPath();
    ctx.rect(-18, -18, 36, 36);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'diamond') {
    // Yellow outline diamond
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
    // Circular orange warning sign
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// Fill static high-contrast noise inside a rectangle boundary (slowed down, deterministic LCG)
function fillNoiseRect(x, y, w, h) {
  const cellSize = 4; // Smaller cell block size for high-resolution static texture
  const cols = Math.ceil(w / cellSize);
  const rows = Math.ceil(h / cellSize);

  // Update static pattern every 120ms (prevents high-frequency visual vibration)
  const timeBlock = Math.floor(performance.now() / 120);
  let seed = timeBlock * 31 + Math.sin(x) * 17 + Math.cos(y) * 13;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Linear Congruential Generator
      seed = (seed * 9301 + 49297) % 233280;
      const rand = seed / 233280;

      if (rand < 0.35) {
        ctx.fillStyle = '#020617';
      } else if (rand < 0.70) {
        ctx.fillStyle = '#1e293b';
      } else if (rand < 0.90) {
        ctx.fillStyle = '#475569';
      } else {
        ctx.fillStyle = '#cbd5e1';
      }
      ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
    }
  }
}

// Draw visual static mask (local shapes over background landscape, not full screen)
function drawNoiseMask() {
  // 1. Draw the clean background landscape first
  drawProceduralBackground();

  // 2. Draw central rounded rectangle mask (covering the vehicle choice area)
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

  // 3. Draw circular static mask at all possible peripheral sign locations
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

// Draw central fixation crosshair
function drawFixation() {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;

  // Outer ring
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, 28, 0, Math.PI * 2);
  ctx.stroke();

  // Central dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(CENTER_X - 40, CENTER_Y);
  ctx.lineTo(CENTER_X - 12, CENTER_Y);
  ctx.moveTo(CENTER_X + 12, CENTER_Y);
  ctx.lineTo(CENTER_X + 40, CENTER_Y);
  ctx.moveTo(CENTER_X, CENTER_Y - 40);
  ctx.lineTo(CENTER_X, CENTER_Y - 12);
  ctx.moveTo(CENTER_X, CENTER_Y + 12);
  ctx.lineTo(CENTER_X, CENTER_Y + 40);
  ctx.stroke();
}

// Draw dynamic radial sector guides (spokes only, drawn only during hover highlights)
function drawRoadSectors() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;

  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  const count = currentLevel.axes || 8;
  const dirs = getDirectionsForLevel();

  // Draw dynamic spokes based on level axes count
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

// Draw visual grid/spoke crowding overlay (Stage 3 crowding grid)
function drawVisualCrowdingGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 1.0;
  
  // Concentric crowding rings
  for (let r = 50; r < 500; r += 50) {
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // High spoke crowding lines (every 15 degrees)
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

// Highlight a full sector slice
function drawSectorHighlight(index, color) {
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

  // Draw pie slice extending past canvas borders
  ctx.arc(CENTER_X, CENTER_Y, 800, startAngle, endAngle);
  ctx.lineTo(CENTER_X, CENTER_Y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draw the inline Central Choice Canvas choices (direct borderless vehicle glows)
function drawCentralChoiceCards() {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Which vehicle did you see?', CENTER_X, CENTER_Y - 140);
  ctx.restore();

  const isCarHovered = (state.hoveredCenterChoice === 'car');
  const carScale = isCarHovered ? 1.45 : 1.25;

  const isTruckHovered = (state.hoveredCenterChoice === 'truck');
  const truckScale = isTruckHovered ? 1.45 : 1.25;

  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  if (currentLevel.similarity === 'EASY') {
    // Choice A: Slate Car, Choice B: Flatbed Truck
    drawCar(CHOICE_CAR_POS.x, CHOICE_CAR_POS.y, carScale, '#4b6584', '#1e272e', isCarHovered, false);
    drawTruck(CHOICE_TRUCK_POS.x, CHOICE_TRUCK_POS.y, truckScale, '#57606f', '#1e272e', isTruckHovered);
  } else if (currentLevel.similarity === 'MID') {
    // Choice A: Slate-blue Car, Choice B: Minivan (identical slate-blue color)
    drawCar(CHOICE_CAR_POS.x, CHOICE_CAR_POS.y, carScale, '#4b6584', '#1e272e', isCarHovered, false);
    drawMinivan(CHOICE_TRUCK_POS.x, CHOICE_TRUCK_POS.y, truckScale, '#4b6584', '#1e272e', isTruckHovered);
  } else {
    // Choice A: Slate-blue Car, Choice B: Identical car with Roof Cargo Rack
    drawCar(CHOICE_CAR_POS.x, CHOICE_CAR_POS.y, carScale, '#4b6584', '#1e272e', isCarHovered, false);
    drawCar(CHOICE_TRUCK_POS.x, CHOICE_TRUCK_POS.y, truckScale, '#4b6584', '#1e272e', isTruckHovered, true);
  }

  // Draw labels
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  
  ctx.fillStyle = isCarHovered ? '#38bdf8' : '#cbd5e1';
  ctx.fillText('Car A', CHOICE_CAR_POS.x, CHOICE_CAR_POS.y + 55);
  
  ctx.fillStyle = isTruckHovered ? '#38bdf8' : '#cbd5e1';
  if (currentLevel.similarity === 'EASY') {
    ctx.fillText('Truck', CHOICE_TRUCK_POS.x, CHOICE_TRUCK_POS.y + 55);
  } else if (currentLevel.similarity === 'MID') {
    ctx.fillText('Minivan', CHOICE_TRUCK_POS.x, CHOICE_TRUCK_POS.y + 55);
  } else {
    ctx.fillText('Car (Rack)', CHOICE_TRUCK_POS.x, CHOICE_TRUCK_POS.y + 55);
  }
  ctx.restore();
}

// Draw feedback annotations (Correct/Incorrect highlights)
function drawFeedback() {
  // Highlight peripheral sectors
  const isPeriphCorrect = (state.userPeriphChoice === state.stimulusAngleIndex);
  
  // Highlight correct stimulus sector (Green)
  drawSectorHighlight(state.stimulusAngleIndex, 'rgba(16, 185, 129, 0.18)');

  // Highlight user incorrect sector choice (Red), if applicable
  if (!isPeriphCorrect && state.userPeriphChoice !== null) {
    drawSectorHighlight(state.userPeriphChoice, 'rgba(244, 63, 94, 0.18)');
  }

  // Redraw sign at correct spot
  const dirs = getDirectionsForLevel();
  const dir = dirs[state.stimulusAngleIndex];
  if (dir) {
    const px = CENTER_X + getPeripheralRadius() * Math.cos(dir.angle);
    const py = CENTER_Y + getPeripheralRadius() * Math.sin(dir.angle);
    drawRoadSign(px, py, 1.1, true);
  }

  // Highlight central object selection correctness
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
  if (state.stimulusCenter === 'car') {
    drawCar(CENTER_X, CENTER_Y - 5, 1.35, '#4b6584', '#1e272e', false, false);
  } else if (state.stimulusCenter === 'minivan') {
    drawMinivan(CENTER_X, CENTER_Y - 5, 1.35, '#4b6584', '#1e272e', false);
  } else if (state.stimulusCenter === 'car_rack') {
    drawCar(CENTER_X, CENTER_Y - 5, 1.35, '#4b6584', '#1e272e', false, true);
  } else {
    drawTruck(CENTER_X, CENTER_Y - 5, 1.35, '#57606f', '#1e272e', false);
  }

  // Label text under center
  ctx.fillStyle = isCenterCorrect ? '#10b981' : '#f43f5e';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  
  let resultText = isCenterCorrect ? 'Correct Central' : 'Wrong Central';
  if (state.userPeriphChoice === null && !isCenterCorrect) {
    resultText += ' (Bypassed Phase 2)';
  }
  ctx.fillText(resultText, CENTER_X, CENTER_Y + 115);

  ctx.restore();
}

// --- Dynamic environment background renderer ---
function drawProceduralBackground() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  
  if (currentLevel.background === 'DESERT') {
    if (bgLoaded) {
      ctx.drawImage(bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(11, 15, 25, 0.40)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback Sky/Ground Gradient
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
      ctx.fillStyle = 'rgba(11, 15, 25, 0.20)'; // Subtle dark overlay for contrast
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback green pasture curves
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
  } else if (currentLevel.background === 'FOREST') {
    if (forestLoaded) {
      ctx.drawImage(forestImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(11, 15, 25, 0.30)'; // Subtle dark overlay
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback Pine trees
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CENTER_Y);
      skyGrad.addColorStop(0, '#2c3e50');
      skyGrad.addColorStop(1, '#1abc9c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#16a085';
      for (let x = 30; x < CANVAS_WIDTH; x += 90) {
        const h = 120 + Math.sin(x) * 40;
        const y = CENTER_Y + 100;
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x - 30, y);
        ctx.lineTo(x + 30, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

// --- Dynamic campaign level configurations mapper ---
function updateCampaignLevelUI() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  
  // Start Screen Level Badge
  const startBadge = document.getElementById('start-level-badge');
  if (startBadge) {
    startBadge.textContent = `Campaign Level ${currentLevel.level}: ${currentLevel.name} (Stage ${currentLevel.stage})`;
  }
  
  // Settings Reset Button Label
  const resetCampaignBtn = document.getElementById('btn-reset-campaign');
  if (resetCampaignBtn) {
    resetCampaignBtn.textContent = `Reset Level ${currentLevel.level}`;
  }
  
  // HUD Status
  if (state.currentPhase === 'IDLE') {
    headerSpeedStatus.textContent = 'Ready';
  } else {
    headerSpeedStatus.textContent = `Level ${currentLevel.level}: ${currentLevel.name}`;
  }

  // Developer Selector Dropdown value
  dbLevelSelect.value = state.currentLevelIndex.toString();
  
  updateDebugPanelMetrics();
}

// --- Live Developer Debug Panel update metrics ---
function updateDebugPanelMetrics() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  dbMetricLevel.textContent = `${currentLevel.level} (${currentLevel.name})`;
  dbMetricDistractors.textContent = `${state.decoys.length} / ${currentLevel.distractors}`;
  dbMetricSpeed.textContent = `${state.flashDuration}ms`;
  dbMetricStreak.textContent = state.correctStreak.toString();
  dbMetricSimilarity.textContent = currentLevel.similarity;
  dbMetricAxes.textContent = currentLevel.axes.toString();

  dbSpeedVal.textContent = `${state.flashDuration} ms`;
}

// --- Main State Machine Controller ---
function changeState(newPhase) {
  state.currentPhase = newPhase;
  state.phaseStartTime = performance.now();

  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  switch (newPhase) {
    case 'IDLE':
      startScreen.classList.remove('hidden');
      gameOverScreen.classList.add('hidden');
      enableInputs(true);
      updateCampaignLevelUI();
      break;

    case 'FIXATION':
      startScreen.classList.add('hidden');
      gameOverScreen.classList.add('hidden');
      document.querySelector('.glow-cyan')?.classList.remove('glow-purple', 'glow-emerald', 'glow-rose');
      document.querySelector('#game-canvas').parentNode.classList.add('glow-cyan');
      enableInputs(false);
      updateCampaignLevelUI();
      break;

    case 'STIMULUS':
      // Map stimulus center vehicle based on stage configurations
      if (currentLevel.similarity === 'EASY') {
        state.stimulusCenter = Math.random() < 0.5 ? 'car' : 'truck';
      } else if (currentLevel.similarity === 'MID') {
        state.stimulusCenter = Math.random() < 0.5 ? 'car' : 'minivan';
      } else {
        state.stimulusCenter = Math.random() < 0.5 ? 'car' : 'car_rack';
      }
      
      const dirs = getDirectionsForLevel();
      state.stimulusAngleIndex = Math.floor(Math.random() * dirs.length);
      state.userCenterChoice = null;
      state.userPeriphChoice = null;

      // Populate distractors dynamically
      generateDecoys();
      updateDebugPanelMetrics();
      break;

    case 'MASK':
      break;

    case 'RESP_CENTRAL':
      break;

    case 'RESP_PERIPH':
      break;

    case 'FEEDBACK':
      processFeedback();
      break;

    case 'GAMEOVER':
      gameOverScreen.classList.remove('hidden');
      showGameOverStats();
      enableInputs(true);
      break;
  }
}

// Generate distractor decoy coordinates dynamically (prevent overlaps with target)
function generateDecoys() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  const targetRadius = getPeripheralRadius();
  const targetAngleIdx = state.stimulusAngleIndex;
  
  const allSlots = [];
  const radii = [RADIUS_CLOSE, RADIUS_MID, RADIUS_FAR];
  const count = currentLevel.axes || 8;
  
  for (let a = 0; a < count; a++) {
    for (let r = 0; r < 3; r++) {
      const radius = radii[r];
      // Skip target slot
      if (a === targetAngleIdx && radius === targetRadius) {
        continue;
      }
      allSlots.push({ angleIndex: a, radius: radius });
    }
  }

  // Shuffle slot coordinates
  allSlots.sort(() => Math.random() - 0.5);

  const decoyCount = Math.min(currentLevel.distractors, allSlots.length);
  state.decoys = [];

  for (let i = 0; i < decoyCount; i++) {
    const slot = allSlots[i];
    
    // Pick visual decoy style dynamically based on stage
    let type = 'circle';
    if (currentLevel.stage === 2) {
      type = 'horse_xing'; // Distractors in the pasture are all equestrian warning diamonds
    } else if (currentLevel.stage === 3) {
      const rand = Math.random();
      if (rand < 0.4) type = 'horse_xing';
      else if (rand < 0.6) type = 'triangle';
      else if (rand < 0.8) type = 'box';
      else type = 'diamond';
    }
    
    state.decoys.push({
      angleIndex: slot.angleIndex,
      radius: slot.radius,
      type: type
    });
  }
}

// Enable/Disable HUD inputs while playing
function enableInputs(enable) {
  sliderTrials.disabled = !enable;
  btnResetCampaign.disabled = !enable;
  btnResetLeaderboard.disabled = !enable;
}

// Two-Down, One-Up Adaptive Speed engine logic
function processFeedback() {
  const correctCenter = (state.userCenterChoice === state.stimulusCenter);
  const correctPeriph = (state.userCenterChoice === state.stimulusCenter) && (state.userPeriphChoice === state.stimulusAngleIndex);
  const isTrialCorrect = correctCenter && correctPeriph;

  state.trialResults.push(isTrialCorrect);
  state.speedHistory.push(state.flashDuration);

  let pointsEarned = 0;
  
  if (isTrialCorrect) {
    playSound('success');

    // ONLY decrease speed after 2 consecutive correct trials (Two-Down)
    if (!state.speedLocked) {
      state.correctStreak++;
      if (state.correctStreak === 2) {
        state.correctStreak = 0;
        
        // Precise decrease intervals near thresholds
        if (state.flashDuration > 300) {
          state.flashDuration = Math.max(32, state.flashDuration - 50);
        } else if (state.flashDuration > 150) {
          state.flashDuration = Math.max(32, state.flashDuration - 20);
        } else {
          state.flashDuration = Math.max(32, state.flashDuration - 8);
        }
      }
    }
    
    // Increment points
    const multiplier = 1 + Math.min(4, Math.floor(state.correctStreak / 3)) * 0.5;
    pointsEarned = Math.round((1000 / state.flashDuration) * 10 * multiplier);
    state.score += pointsEarned;

    const container = canvas.parentNode;
    container.classList.remove('glow-cyan', 'glow-rose');
    container.classList.add('glow-emerald');
  } else {
    // Immediate speed increase on a single error (One-Up)
    playSound('failure');
    state.correctStreak = 0;
    
    if (!state.speedLocked) {
      state.flashDuration = Math.min(2600, state.flashDuration + 40);
    }

    const container = canvas.parentNode;
    container.classList.remove('glow-cyan', 'glow-emerald');
    container.classList.add('glow-rose');
  }

  updateHUDAfterTrial(isTrialCorrect);
  updateDebugPanelMetrics();
}

// Update HUD displays
function updateHUDAfterTrial(correct) {
  hudScore.textContent = state.score.toLocaleString();
  hudStreak.textContent = state.correctStreak;
  const multiplier = 1 + Math.min(4, Math.floor(state.correctStreak / 3)) * 0.5;
  hudMultiplier.textContent = `x${multiplier.toFixed(1)}`;

  hudSpeedVal.innerHTML = `${state.flashDuration}<span class="text-xs font-normal text-slate-500 ml-1">ms</span>`;
  const percentage = ((2600 - state.flashDuration) / (2600 - 32)) * 100;
  hudSpeedBar.style.width = `${percentage}%`;

  const dots = hudDotsContainer.children;
  if (dots[state.trialNumber - 1]) {
    dots[state.trialNumber - 1].className = `w-3 h-3 rounded-full flex-shrink-0 border ${
      correct 
        ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/20' 
        : 'bg-rose-500 border-rose-400 shadow-md shadow-rose-500/20'
    }`;
  }
}

// Display game over screen metrics & campaign unlocks
function showGameOverStats() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  goFinalSpeed.innerHTML = `${state.flashDuration}<span class="text-sm font-normal text-slate-400 ml-1">ms</span>`;
  
  const bestSpeed = Math.min(...state.speedHistory);
  goBestSpeed.innerHTML = `${bestSpeed}<span class="text-sm font-normal text-slate-400 ml-1">ms</span>`;

  const correctCount = state.trialResults.filter(Boolean).length;
  const accuracy = Math.round((correctCount / state.maxTrials) * 100);
  goAccuracy.textContent = `${accuracy}%`;
  
  goPoints.textContent = state.score.toLocaleString();

  // Campaign level progression unlocks: requires 75% accuracy
  const titleText = gameOverScreen.querySelector('h2');
  if (accuracy >= 75) {
    if (state.currentLevelIndex < LEVEL_MATRIX.length - 1) {
      titleText.innerHTML = `<span class="text-emerald-400">Level ${currentLevel.level} Cleared!</span>`;
      btnNextLevel.classList.remove('hidden');
    } else {
      titleText.innerHTML = `<span class="text-yellow-400 font-extrabold animate-pulse">UFOV Champion!</span>`;
      btnNextLevel.classList.add('hidden');
    }
  } else {
    titleText.innerHTML = `<span class="text-rose-400">Try Again</span>`;
    titleText.insertAdjacentHTML('afterend', `<p id="fail-desc" class="text-xs text-rose-300 mt-1">Get at least 75% accuracy to unlock the next level.</p>`);
    btnNextLevel.classList.add('hidden');
  }

  saveScoreToLeaderboard(state.score, bestSpeed, accuracy);
  plotProgressionGraph();
}

function plotProgressionGraph() {
  const width = goChart.clientWidth || 380;
  const height = 128;
  goChart.setAttribute('viewBox', `0 0 ${width} ${height}`);

  if (state.speedHistory.length === 0) return;

  const maxVal = Math.max(...state.speedHistory, state.startingSpeed);
  const minVal = Math.min(...state.speedHistory, 32);
  const valRange = maxVal - minVal || 100;

  const points = state.speedHistory.map((val, idx) => {
    const x = (idx / (state.maxTrials - 1)) * (width - 40) + 20;
    const y = ((val - minVal) / valRange) * (height - 30) + 15;
    return { x, y, val, correct: state.trialResults[idx] };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  let svgContent = `
    <line x1="20" y1="15" x2="${width-20}" y2="15" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
    <line x1="20" y1="${height/2}" x2="${width-20}" y2="${height/2}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
    <line x1="20" y1="${height-15}" x2="${width-20}" y2="${height-15}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
    
    <text x="${width-18}" y="18" fill="#a855f7" font-size="8" font-family="monospace" text-anchor="end">${Math.round(minVal)}ms</text>
    <text x="${width-18}" y="${height-12}" fill="#6b7280" font-size="8" font-family="monospace" text-anchor="end">${Math.round(maxVal)}ms</text>

    <path d="${pathD}" fill="none" stroke="url(#gradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    
    ${points.map((p, i) => `
      <circle cx="${p.x}" cy="${p.y}" r="4" 
              fill="${p.correct ? '#10b981' : '#f43f5e'}" 
              stroke="#0b0f19" stroke-width="1.5" />
    `).join('')}

    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#22d3ee" />
        <stop offset="100%" stop-color="#a855f7" />
      </linearGradient>
    </defs>
  `;

  goChart.innerHTML = svgContent;
}

// --- Leaderboard Storage ---
function loadLeaderboard() {
  const stored = localStorage.getItem('double_decision_leaderboard');
  state.highScores = stored ? JSON.parse(stored) : [];
  renderLeaderboard();

  if (state.highScores.length > 0) {
    headerHighScore.textContent = `${state.highScores[0].score.toLocaleString()} pts`;
  } else {
    headerHighScore.textContent = '0 pts';
  }

}

function saveScoreToLeaderboard(score, bestSpeed, accuracy) {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  const newEntry = {
    score,
    bestSpeed,
    accuracy,
    date: `Lvl ${currentLevel.level}`
  };

  state.highScores.push(newEntry);
  state.highScores.sort((a, b) => b.score - a.score);
  state.highScores = state.highScores.slice(0, 5);

  localStorage.setItem('double_decision_leaderboard', JSON.stringify(state.highScores));
  renderLeaderboard();
  
  headerHighScore.textContent = `${state.highScores[0].score.toLocaleString()} pts`;
}

function renderLeaderboard() {
  leaderboardList.innerHTML = '';
  if (state.highScores.length === 0) {
    leaderboardList.innerHTML = '<li class="text-slate-500 italic py-2 text-center">No runs recorded</li>';
    return;
  }

  state.highScores.forEach((entry, idx) => {
    const li = document.createElement('li');
    li.className = "flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all";
    li.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="font-bold font-mono text-[10px] w-4 h-4 rounded-full flex items-center justify-center ${
          idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-slate-400'
        }">${idx + 1}</span>
        <span class="font-semibold text-slate-300">${entry.score.toLocaleString()} pts</span>
      </div>
      <div class="flex items-center space-x-3 text-slate-400 font-mono text-[10px]">
        <span class="text-purple-400">${entry.date}</span>
        <span>Speed: <strong class="text-cyan-400 font-bold">${entry.bestSpeed}ms</strong></span>
        <span>Acc: <strong class="text-emerald-400 font-bold">${entry.accuracy}%</strong></span>
      </div>
    `;
    leaderboardList.appendChild(li);
  });
}

// --- Canvas Game Loop and Core Operations ---

function setupNewTrial() {
  state.trialNumber++;
  hudProgressText.textContent = `Trial ${state.trialNumber} / ${state.maxTrials}`;
  
  // Dynamic progression checks
  updateCampaignLevelUI();
  
  changeState('FIXATION');
}

function initGame() {
  state.score = 0;
  state.correctStreak = 0;
  state.trialNumber = 0;
  
  // Set initial speed threshold to exactly 500 ms at launch of any level
  state.flashDuration = state.speedLocked ? state.lockedSpeedVal : 500;
  state.startingSpeed = state.flashDuration;
  state.trialResults = [];
  state.speedHistory = [];

  // Clean instructions insertions
  const desc = document.getElementById('fail-desc');
  if (desc) desc.remove();

  // Reset HUD
  hudScore.textContent = '0';
  hudStreak.textContent = '0';
  hudMultiplier.textContent = 'x1.0';
  hudSpeedVal.innerHTML = `${state.flashDuration}<span class="text-xs font-normal text-slate-500 ml-1">ms</span>`;
  hudSpeedBar.style.width = `${((2600 - state.flashDuration) / (2600 - 32)) * 100}%`;

  // Draw trial progress dots
  hudDotsContainer.innerHTML = '';
  for (let i = 0; i < state.maxTrials; i++) {
    const dot = document.createElement('div');
    dot.className = 'w-3 h-3 rounded-full flex-shrink-0 border border-white/10 bg-white/5';
    hudDotsContainer.appendChild(dot);
  }

  setupNewTrial();
}

// General Render pipeline
function draw() {
  // 1. Draw dynamic environment background scene
  if (state.currentPhase !== 'MASK') {
    drawProceduralBackground();
  }

  // Draw visual crowding overlay in Stage 3 active states
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  if (state.currentPhase !== 'MASK' && currentLevel.background === 'FOREST') {
    drawVisualCrowdingGrid();
  }

  // 2. Render contents depending on current state
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
      // Render Central Vehicle based on stage similarity rules
      if (state.stimulusCenter === 'car') {
        drawCar(CENTER_X, CENTER_Y, 1.0, '#4b6584', '#1e272e', false, false);
      } else if (state.stimulusCenter === 'minivan') {
        drawMinivan(CENTER_X, CENTER_Y, 1.0, '#4b6584', '#1e272e', false);
      } else if (state.stimulusCenter === 'car_rack') {
        drawCar(CENTER_X, CENTER_Y, 1.0, '#4b6584', '#1e272e', false, true);
      } else {
        drawTruck(CENTER_X, CENTER_Y, 1.0, '#57606f', '#1e272e', false);
      }

      // Render Peripheral Route 66 Shield sign
      const dirs = getDirectionsForLevel();
      const dir = dirs[state.stimulusAngleIndex];
      if (dir) {
        const px = CENTER_X + getPeripheralRadius() * Math.cos(dir.angle);
        const py = CENTER_Y + getPeripheralRadius() * Math.sin(dir.angle);
        drawRoadSign(px, py, 1.0, true);
      }

      // Render Peripheral Decoys (Distractors)
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
      // Draw Sector highlights based on mouse hover position
      if (state.hoveredSectorIndex !== null) {
        drawSectorHighlight(state.hoveredSectorIndex, 'rgba(255, 255, 255, 0.08)');
      }

      // Draw faint center guide circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, 35, 0, Math.PI * 2);
      ctx.stroke();

      // Label prompt on top
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

// Precision Animation Loop
function gameLoop(timestamp) {
  const elapsed = timestamp - state.phaseStartTime;

  if (state.currentPhase === 'FIXATION') {
    if (elapsed >= 1000) {
      changeState('STIMULUS');
    }
  } else if (state.currentPhase === 'STIMULUS') {
    // If stimulus freeze debug option is checked, bypass transition timers
    if (!state.freezeStimulusPhase) {
      if (elapsed >= state.flashDuration) {
        if (state.enableMaskPhase) {
          changeState('MASK');
        } else {
          changeState('RESP_CENTRAL');
        }
      }
    }
  } else if (state.currentPhase === 'MASK') {
    // Mask duration is exactly 300 ms (to eliminate retinal after-images)
    if (elapsed >= 300) {
      changeState('RESP_CENTRAL');
    }
  } else if (state.currentPhase === 'FEEDBACK') {
    if (elapsed >= 1500) {
      if (state.trialNumber >= state.maxTrials) {
        changeState('GAMEOVER');
      } else {
        setupNewTrial();
      }
    }
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// --- Interaction / Event Listeners ---

// Track mouse position and update hover states
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;

  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  if (state.currentPhase === 'RESP_CENTRAL') {
    const distCar = Math.hypot(mouseX - CHOICE_CAR_POS.x, mouseY - CHOICE_CAR_POS.y);
    const distTruck = Math.hypot(mouseX - CHOICE_TRUCK_POS.x, mouseY - CHOICE_TRUCK_POS.y);
    
    if (distCar <= CHOICE_RADIUS) {
      state.hoveredCenterChoice = 'car';
    } else if (distTruck <= CHOICE_RADIUS) {
      state.hoveredCenterChoice = 'truck';
    } else {
      state.hoveredCenterChoice = null;
    }
  } else if (state.currentPhase === 'RESP_PERIPH') {
    const dx = mouseX - CENTER_X;
    const dy = mouseY - CENTER_Y;
    const dist = Math.hypot(dx, dy);

    if (dist > 50) {
      const angle = Math.atan2(dy, dx);
      let closestIdx = 0;
      let minDiff = Infinity;
      
      const dirs = getDirectionsForLevel();
      dirs.forEach((dir, idx) => {
        let diff = Math.abs(angle - dir.angle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      state.hoveredSectorIndex = closestIdx;
    } else {
      state.hoveredSectorIndex = null;
    }
  } else {
    state.hoveredCenterChoice = null;
    state.hoveredSectorIndex = null;
  }
});

// Canvas click detector
canvas.addEventListener('click', () => {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  if (state.currentPhase === 'RESP_CENTRAL') {
    const distCar = Math.hypot(mouseX - CHOICE_CAR_POS.x, mouseY - CHOICE_CAR_POS.y);
    const distTruck = Math.hypot(mouseX - CHOICE_TRUCK_POS.x, mouseY - CHOICE_TRUCK_POS.y);

    let chosenCenter = null;
    if (distCar <= CHOICE_RADIUS) {
      chosenCenter = 'car';
    } else if (distTruck <= CHOICE_RADIUS) {
      if (currentLevel.similarity === 'EASY') {
        chosenCenter = 'truck';
      } else if (currentLevel.similarity === 'MID') {
        chosenCenter = 'minivan';
      } else {
        chosenCenter = 'car_rack';
      }
    }

    if (chosenCenter !== null) {
      state.userCenterChoice = chosenCenter;
      playSound('tick');

      // STRICT RESPONSE 1 INTERCEPT
      if (chosenCenter === state.stimulusCenter) {
        changeState('RESP_PERIPH');
      } else {
        state.userPeriphChoice = null; // Bypassed
        changeState('FEEDBACK');
      }
    }
  } else if (state.currentPhase === 'RESP_PERIPH') {
    const dx = mouseX - CENTER_X;
    const dy = mouseY - CENTER_Y;
    const dist = Math.hypot(dx, dy);

    if (dist > 50) {
      const angle = Math.atan2(dy, dx);
      let closestIdx = 0;
      let minDiff = Infinity;
      
      const dirs = getDirectionsForLevel();
      dirs.forEach((dir, idx) => {
        let diff = Math.abs(angle - dir.angle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      state.userPeriphChoice = closestIdx;
      state.hoveredSectorIndex = null;
      playSound('tick');
      changeState('FEEDBACK');
    }
  }
});

// Menu Buttons
btnStart.addEventListener('click', () => {
  playSound('tick');
  initGame();
});

btnRestart.addEventListener('click', () => {
  playSound('tick');
  changeState('IDLE');
});

btnNextLevel.addEventListener('click', () => {
  playSound('tick');
  if (state.currentLevelIndex < LEVEL_MATRIX.length - 1) {
    state.currentLevelIndex++;
  }
  changeState('IDLE');
});

// Settings handlers
toggleSound.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  toggleSound.className = state.soundEnabled 
    ? "w-10 h-6 bg-cyan-600 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative"
    : "w-10 h-6 bg-dark-700 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative";
  toggleSoundDot.className = state.soundEnabled 
    ? "w-5 h-5 bg-white rounded-full shadow-md transform translate-x-4 transition-transform duration-200"
    : "w-5 h-5 bg-slate-400 rounded-full shadow-md transform translate-x-0 transition-transform duration-200";
  playSound('tick');
});

sliderTrials.addEventListener('input', (e) => {
  state.maxTrials = parseInt(e.target.value);
  trialsVal.textContent = `${state.maxTrials} trials`;
});

btnResetCampaign.addEventListener('click', () => {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  if (confirm(`Are you sure you want to reset Level ${currentLevel.level} progression back to Level 1?`)) {
    state.currentLevelIndex = 0;
    changeState('IDLE');
    playSound('tick');
  }
});

btnResetLeaderboard.addEventListener('click', () => {
  if (confirm("Are you sure you want to clear high scores?")) {
    localStorage.removeItem('double_decision_leaderboard');
    state.highScores = [];
    renderLeaderboard();
    headerHighScore.textContent = '0 pts';
    playSound('tick');
  }
});

// --- Developer Debug Panel Event Listeners ---

// Level selection skip selector
dbLevelSelect.addEventListener('change', (e) => {
  state.currentLevelIndex = parseInt(e.target.value);
  
  // Set initial speed threshold to 500 ms for the loaded level
  state.flashDuration = state.speedLocked ? state.lockedSpeedVal : 500;
  state.correctStreak = 0;
  
  changeState('IDLE');
  playSound('tick');
});

// Lock Flash Speed Checkbox
dbLockSpeed.addEventListener('change', (e) => {
  state.speedLocked = e.target.checked;
  if (state.speedLocked) {
    state.lockedSpeedVal = parseInt(dbSpeedSlider.value);
    state.flashDuration = state.lockedSpeedVal;
  } else {
    state.flashDuration = 500;
  }
  updateCampaignLevelUI();
  playSound('tick');
});

// Lock Speed Slider
dbSpeedSlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  dbSpeedVal.textContent = `${val} ms`;
  if (state.speedLocked) {
    state.lockedSpeedVal = val;
    state.flashDuration = val;
    updateCampaignLevelUI();
  }
});

// Enable/Disable Visual Mask
dbEnableMask.addEventListener('change', (e) => {
  state.enableMaskPhase = e.target.checked;
  playSound('tick');
});

// Freeze Stimulus Phase Checkbox
dbFreezeStimulus.addEventListener('change', (e) => {
  state.freezeStimulusPhase = e.target.checked;
  playSound('tick');
});

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard();
  updateCampaignLevelUI();
  requestAnimationFrame(gameLoop);
});
