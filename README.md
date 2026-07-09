# Double Decision Cognitive Trainer

A responsive, high-performance web clone of BrainHQ's classic cognitive game **Double Decision**, built with HTML5 Canvas, Vanilla JavaScript, and Tailwind CSS. It is designed to train speed of processing and expand your **Useful Field of View (UFOV)**.

## Features

1. **Precision Game Loop & High-Precision Timing**:
   - Utilizes `requestAnimationFrame` for stutter-free, frame-synced canvas rendering.
   - Measures exact presentation periods utilizing `performance.now()`, ensuring sub-millisecond accuracy when flashing the central vehicle and peripheral sign.
2. **Procedural Vector Drawing**:
   - Stimuli (Car, Truck, road warning sign) are drawn procedurally using the HTML5 Canvas 2D context.
   - High-contrast neon aesthetics tailored for modern dark mode setups.
3. **Double Response Verification**:
   - **Part 1**: Determine if the vehicle in the center was a Car or a Truck.
   - **Part 2**: Locate which of the 8 peripheral quadrants/directions (North, North-East, East, etc.) contained the yellow road sign.
4. **Adaptive Difficulty Engine**:
   - Automatically adapts speed threshold depending on performance:
     - **Both Correct**: Decrease presentation flash duration by **20ms** (making it faster/harder, down to a minimum of 16ms).
     - **Either Incorrect**: Increase presentation flash duration by **20ms** (making it slower/easier, up to a maximum of 1000ms).
5. **Interactive Controls & Sidebar HUD**:
   - Toggle auxiliary grid guide lines (helps trace visual lanes to peripheral regions).
   - Adjust volume and toggle synthesizer sound effects (using Web Audio API).
   - Configure starting flash speed (50ms - 500ms) and session length (10 - 50 trials).
   - Real-time score multiplier system (streaks increase point payouts).
   - Speed performance history plotted dynamically as an SVG graph upon session completion.
6. **Local Score Leaderboard**:
   - Saves daily scores, accuracy rates, and peak speed records to `localStorage`.

## Tech Stack

- **Core Structure**: HTML5 Canvas, HTML5 Semantic Tags
- **Styling**: Tailwind CSS (v3 Play CDN) and custom CSS (glassmorphic filters, animations)
- **Programming Language**: Vanilla ES6 JavaScript
- **Audio Feedback**: Web Audio API (real-time synthesizers, no latency)
