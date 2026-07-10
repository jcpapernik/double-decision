// --- Canvas Setup ---
export const canvas = document.getElementById('game-canvas');
export const ctx = canvas.getContext('2d');

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 720;
export const CENTER_X = CANVAS_WIDTH / 2;
export const CENTER_Y = CANVAS_HEIGHT / 2;

// --- Screen Containers ---
export const startScreen = document.getElementById('start-screen');
export const gameOverScreen = document.getElementById('game-over-screen');

// --- Primary Action Buttons ---
export const btnStart = document.getElementById('btn-start');
export const btnRestart = document.getElementById('btn-restart');
export const btnNextLevel = document.getElementById('btn-next-level');

// --- Settings Controls ---
export const toggleSound = document.getElementById('toggle-sound');
export const toggleSoundDot = document.getElementById('toggle-sound-dot');
export const btnResetCampaign = document.getElementById('btn-reset-campaign');
export const btnResetLeaderboard = document.getElementById('btn-reset-leaderboard');

export const sliderTrials = document.getElementById('slider-trials');
export const trialsVal = document.getElementById('trials-val');

// --- HUD Stats Nodes ---
export const hudSpeedVal = document.getElementById('hud-speed-val');
export const hudSpeedBar = document.getElementById('hud-speed-bar');
export const hudScore = document.getElementById('hud-score');
export const hudStreak = document.getElementById('hud-streak');
export const hudMultiplier = document.getElementById('hud-multiplier');
export const hudProgressText = document.getElementById('hud-progress-text');
export const hudDotsContainer = document.getElementById('hud-dots');

// --- Header Stats Nodes ---
export const headerHighScore = document.getElementById('header-high-score');
export const headerSpeedStatus = document.getElementById('header-speed-status');
export const leaderboardList = document.getElementById('leaderboard-list');

// --- Game Over Score Report Nodes ---
export const goFinalSpeed = document.getElementById('go-final-speed');
export const goBestSpeed = document.getElementById('go-best-speed');
export const goAccuracy = document.getElementById('go-accuracy');
export const goPoints = document.getElementById('go-points');
export const goChart = document.getElementById('go-chart');

// --- Developer Debug Tools ---
export const dbLevelSelect = document.getElementById('db-level-select');
export const dbLockSpeed = document.getElementById('db-lock-speed');
export const dbSpeedSlider = document.getElementById('db-speed-slider');
export const dbSpeedVal = document.getElementById('db-speed-val');
export const dbEnableMask = document.getElementById('db-enable-mask');
export const dbFreezeStimulus = document.getElementById('db-freeze-stimulus');

export const dbMetricLevel = document.getElementById('db-metric-level');
export const dbMetricDistractors = document.getElementById('db-metric-distractors');
export const dbMetricSpeed = document.getElementById('db-metric-speed');
export const dbMetricStreak = document.getElementById('db-metric-streak');
export const dbMetricSimilarity = document.getElementById('db-metric-similarity');
export const dbMetricAxes = document.getElementById('db-metric-axes');
