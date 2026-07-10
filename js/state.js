// --- Game State Variables ---
export const state = {
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
  stimulusCenter: 'convertible', // Dynamic key matching LEVEL_MATRIX configuration
  stimulusAngleIndex: 0,         // Index in the dynamic directions array

  // Dynamic coordinates
  centralSimilarity: 'EASY',     // EASY, MID, HARD
  peripheralDistance: 'CLOSE',   // CLOSE, MID, FAR
  distractorCount: 0,            // Decoy count limit
  backgroundComplexity: 'DESERT', // DESERT, FARMLAND, FOREST
  decoys: [],                    // Distractor coordinates: [{ angleIndex, radius, type }]

  // User inputs
  userCenterChoice: null, // Chosen vehicle name
  userPeriphChoice: null, // Sector angle index chosen

  // Interactive Hovering States
  hoveredCenterChoice: null, // 'car', 'truck' (left vs right choice cards)
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
