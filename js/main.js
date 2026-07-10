import {
  canvas,
  ctx,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CENTER_X,
  CENTER_Y,
  startScreen,
  gameOverScreen,
  btnStart,
  btnRestart,
  btnNextLevel,
  toggleSound,
  toggleSoundDot,
  btnResetCampaign,
  btnResetLeaderboard,
  sliderTrials,
  trialsVal,
  hudSpeedVal,
  hudSpeedBar,
  hudScore,
  hudStreak,
  hudMultiplier,
  hudProgressText,
  hudDotsContainer,
  headerHighScore,
  headerSpeedStatus,
  leaderboardList,
  goFinalSpeed,
  goBestSpeed,
  goAccuracy,
  goPoints,
  goChart,
  dbLevelSelect,
  dbLockSpeed,
  dbSpeedSlider,
  dbSpeedVal,
  dbEnableMask,
  dbFreezeStimulus,
  dbMetricLevel,
  dbMetricDistractors,
  dbMetricSpeed,
  dbMetricStreak,
  dbMetricSimilarity,
  dbMetricAxes
} from './dom.js';

import { state } from './state.js';

import {
  RADIUS_CLOSE,
  RADIUS_MID,
  RADIUS_FAR,
  CHOICE_CAR_POS,
  CHOICE_TRUCK_POS,
  CHOICE_RADIUS,
  LEVEL_MATRIX,
  getDirectionsForLevel,
  getPeripheralRadius
} from './config.js';

import { playSound, resumeAudioContext } from './audio.js';

import { draw, initNoiseFrames } from './drawers.js';

// --- Local Variable Declarations ---
let mouseX = 0;
let mouseY = 0;

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
  
  updateCampaignLevelUI();
  changeState('FIXATION');
}

function initGame() {
  state.score = 0;
  state.correctStreak = 0;
  state.trialNumber = 0;
  
  state.flashDuration = state.speedLocked ? state.lockedSpeedVal : 500;
  state.startingSpeed = state.flashDuration;
  state.trialResults = [];
  state.speedHistory = [];

  const desc = document.getElementById('fail-desc');
  if (desc) desc.remove();

  hudScore.textContent = '0';
  hudStreak.textContent = '0';
  hudMultiplier.textContent = 'x1.0';
  hudSpeedVal.innerHTML = `${state.flashDuration}<span class="text-xs font-normal text-slate-500 ml-1">ms</span>`;
  hudSpeedBar.style.width = `${((2600 - state.flashDuration) / (2600 - 32)) * 100}%`;

  hudDotsContainer.innerHTML = '';
  for (let i = 0; i < state.maxTrials; i++) {
    const dot = document.createElement('div');
    dot.className = 'w-3 h-3 rounded-full flex-shrink-0 border border-white/10 bg-white/5';
    hudDotsContainer.appendChild(dot);
  }

  setupNewTrial();
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
      if (a === targetAngleIdx && radius === targetRadius) {
        continue;
      }
      allSlots.push({ angleIndex: a, radius: radius });
    }
  }

  allSlots.sort(() => Math.random() - 0.5);

  const decoyCount = Math.min(currentLevel.distractors, allSlots.length);
  state.decoys = [];

  for (let i = 0; i < decoyCount; i++) {
    const slot = allSlots[i];
    
    let type = 'circle';
    if (currentLevel.stage === 2) {
      type = 'horse_xing';
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

function enableInputs(enable) {
  sliderTrials.disabled = !enable;
  btnResetCampaign.disabled = !enable;
  btnResetLeaderboard.disabled = !enable;
}

function processFeedback() {
  const correctCenter = (state.userCenterChoice === state.stimulusCenter);
  const correctPeriph = (state.userCenterChoice === state.stimulusCenter) && (state.userPeriphChoice === state.stimulusAngleIndex);
  const isTrialCorrect = correctCenter && correctPeriph;

  state.trialResults.push(isTrialCorrect);
  state.speedHistory.push(state.flashDuration);

  let pointsEarned = 0;
  
  if (isTrialCorrect) {
    playSound('success');

    if (!state.speedLocked) {
      state.correctStreak++;
      if (state.correctStreak === 2) {
        state.correctStreak = 0;
        
        if (state.flashDuration > 300) {
          state.flashDuration = Math.max(32, state.flashDuration - 50);
        } else if (state.flashDuration > 150) {
          state.flashDuration = Math.max(32, state.flashDuration - 20);
        } else {
          state.flashDuration = Math.max(32, state.flashDuration - 8);
        }
      }
    }
    
    const multiplier = 1 + Math.min(4, Math.floor(state.correctStreak / 3)) * 0.5;
    pointsEarned = Math.round((1000 / state.flashDuration) * 10 * multiplier);
    state.score += pointsEarned;

    const container = canvas.parentNode;
    container.classList.remove('glow-cyan', 'glow-rose');
    container.classList.add('glow-emerald');
  } else {
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

function showGameOverStats() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  goFinalSpeed.innerHTML = `${state.flashDuration}<span class="text-sm font-normal text-slate-400 ml-1">ms</span>`;
  
  const bestSpeed = Math.min(...state.speedHistory);
  goBestSpeed.innerHTML = `${bestSpeed}<span class="text-sm font-normal text-slate-400 ml-1">ms</span>`;

  const correctCount = state.trialResults.filter(Boolean).length;
  const accuracy = Math.round((correctCount / state.maxTrials) * 100);
  goAccuracy.textContent = `${accuracy}%`;
  
  goPoints.textContent = state.score.toLocaleString();

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
    
    ${points.map((p) => `
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

function updateCampaignLevelUI() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  
  const startBadge = document.getElementById('start-level-badge');
  if (startBadge) {
    startBadge.textContent = `Campaign Level ${currentLevel.level}: ${currentLevel.name} (Stage ${currentLevel.stage})`;
  }
  
  const resetCampaignBtn = document.getElementById('btn-reset-campaign');
  if (resetCampaignBtn) {
    resetCampaignBtn.textContent = `Reset Level ${currentLevel.level}`;
  }
  
  if (state.currentPhase === 'IDLE') {
    headerSpeedStatus.textContent = 'Ready';
  } else {
    headerSpeedStatus.textContent = `Level ${currentLevel.level}: ${currentLevel.name}`;
  }

  dbLevelSelect.value = state.currentLevelIndex.toString();
  
  updateDebugPanelMetrics();
}

function updateDebugPanelMetrics() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  dbMetricLevel.textContent = `${currentLevel.level} (${currentLevel.name})`;
  dbMetricDistractors.textContent = `${state.decoys.length} / ${currentLevel.distractors}`;
  dbMetricSpeed.textContent = `${state.flashDuration}ms`;
  dbMetricStreak.textContent = state.correctStreak.toString();
  dbMetricSimilarity.textContent = `${currentLevel.vehicleA} vs ${currentLevel.vehicleB}`;
  dbMetricAxes.textContent = currentLevel.axes.toString();

  dbSpeedVal.textContent = `${state.flashDuration} ms`;
}

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
      state.stimulusCenter = Math.random() < 0.5 ? currentLevel.vehicleA : currentLevel.vehicleB;
      
      const dirs = getDirectionsForLevel();
      state.stimulusAngleIndex = Math.floor(Math.random() * dirs.length);
      state.userCenterChoice = null;
      state.userPeriphChoice = null;

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

// Precision Animation Loop
function gameLoop(timestamp) {
  const elapsed = timestamp - state.phaseStartTime;

  if (state.currentPhase === 'FIXATION') {
    if (elapsed >= 1000) {
      changeState('STIMULUS');
    }
  } else if (state.currentPhase === 'STIMULUS') {
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

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;

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

canvas.addEventListener('click', () => {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];

  if (state.currentPhase === 'RESP_CENTRAL') {
    const distCar = Math.hypot(mouseX - CHOICE_CAR_POS.x, mouseY - CHOICE_CAR_POS.y);
    const distTruck = Math.hypot(mouseX - CHOICE_TRUCK_POS.x, mouseY - CHOICE_TRUCK_POS.y);

    let chosenCenter = null;
    if (distCar <= CHOICE_RADIUS) {
      chosenCenter = currentLevel.vehicleA;
    } else if (distTruck <= CHOICE_RADIUS) {
      chosenCenter = currentLevel.vehicleB;
    }

    if (chosenCenter !== null) {
      state.userCenterChoice = chosenCenter;
      playSound('tick');

      if (chosenCenter === state.stimulusCenter) {
        changeState('RESP_PERIPH');
      } else {
        state.userPeriphChoice = null;
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
  resumeAudioContext();
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
    localStorage.setItem('double_decision_campaign_level', state.currentLevelIndex.toString());
  }
  changeState('IDLE');
});

// Settings Events
toggleSound.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  playSound('tick');
  if (state.soundEnabled) {
    toggleSoundDot.style.transform = 'translateX(24px)';
    toggleSound.classList.remove('bg-dark-600');
    toggleSound.classList.add('bg-purple-600');
  } else {
    toggleSoundDot.style.transform = 'translateX(0px)';
    toggleSound.classList.remove('bg-purple-600');
    toggleSound.classList.add('bg-dark-600');
  }
});

btnResetCampaign.addEventListener('click', () => {
  playSound('tick');
  const confirmReset = confirm("Reset current level progress back to start?");
  if (confirmReset) {
    state.correctStreak = 0;
    state.flashDuration = 500;
    state.startingSpeed = 500;
    updateCampaignLevelUI();
  }
});

btnResetLeaderboard.addEventListener('click', () => {
  playSound('tick');
  const confirmReset = confirm("Reset all leaderboard scores?");
  if (confirmReset) {
    localStorage.removeItem('double_decision_leaderboard');
    loadLeaderboard();
  }
});

sliderTrials.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  state.maxTrials = val;
  trialsVal.textContent = val;
});

// Debug Tools
dbLevelSelect.addEventListener('change', (e) => {
  const val = parseInt(e.target.value);
  state.currentLevelIndex = val;
  localStorage.setItem('double_decision_campaign_level', val.toString());
  playSound('tick');
  updateCampaignLevelUI();
});

dbLockSpeed.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  state.speedLocked = isChecked;
  playSound('tick');
  
  if (isChecked) {
    dbSpeedSlider.disabled = false;
    state.lockedSpeedVal = parseInt(dbSpeedSlider.value);
    state.flashDuration = state.lockedSpeedVal;
  } else {
    dbSpeedSlider.disabled = true;
    state.flashDuration = 500;
  }
  updateCampaignLevelUI();
});

dbSpeedSlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  dbSpeedVal.textContent = `${val} ms`;
  if (state.speedLocked) {
    state.lockedSpeedVal = val;
    state.flashDuration = val;
    updateCampaignLevelUI();
  }
});

dbEnableMask.addEventListener('change', (e) => {
  state.enableMaskPhase = e.target.checked;
  playSound('tick');
});

dbFreezeStimulus.addEventListener('change', (e) => {
  state.freezeStimulusPhase = e.target.checked;
  playSound('tick');
});

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  // Restore persistent level progress on load
  const restoredIndex = localStorage.getItem('double_decision_campaign_level');
  if (restoredIndex !== null) {
    state.currentLevelIndex = parseInt(restoredIndex);
  }

  initNoiseFrames();
  loadLeaderboard();
  updateCampaignLevelUI();

  // Expose automation hooks for browser automation/brute-forcing testing
  window.gameAutomation = {
    state,
    LEVEL_MATRIX,
    CHOICE_CAR_POS,
    CHOICE_TRUCK_POS,
    getDirectionsForLevel,
    getPeripheralRadius,
    initGame,
    changeState
  };

  requestAnimationFrame(gameLoop);
});
