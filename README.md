# Double Decision - Cognitive Useful Field of View (UFOV) Trainer

A responsive, high-performance web clone of BrainHQ's classic cognitive game **Double Decision**, built with HTML5 Canvas, Vanilla JavaScript, and Tailwind CSS. It is designed to train speed of processing and expand your **Useful Field of view (UFOV)**.

---

## 🎮 Play Online

You can play the game instantly in your browser here:
👉 **[jcpapernik.github.io/double-decision](https://jcpapernik.github.io/double-decision/)**

---

## 🚀 How to Run Locally

Since this application runs entirely client-side, you can run it locally in a few different ways:

### Method 1: Local HTTP Server (Recommended)
Running through an HTTP server ensures image assets and scripts load correctly without browser security (CORS) restrictions.

* **Using Python (built-in)**:
  Open your terminal inside the project directory and run:
  ```bash
  python3 -m http.server 8080
  ```
  Then open **[http://localhost:8080](http://localhost:8080)** in your browser.

* **Using Node.js**:
  Install and run a lightweight server:
  ```bash
  npx http-server -p 8080
  ```
  Then open **[http://localhost:8080](http://localhost:8080)** in your browser.

### Method 2: Direct Open
You can simply double-click the `index.html` file in your file explorer to open it directly in your browser (`file:///` protocol). *Note: Some browsers may restrict loading local images or fonts under CORS settings.*

---

## 🌐 How to Deploy to the Web

### Option A: GitHub Pages (Automatic Hosting)
1. Push this directory to a public repository on your GitHub account.
2. Go to **Settings** -> **Pages** in your repository dashboard.
3. Under **Branch**, select **main** and click **Save**.
4. Your site will be live at `https://<your-username>.github.io/<your-repo-name>/`.

### Option B: Vercel (Instant Deploy)
1. Run `npx vercel` inside the project folder.
2. Follow the terminal prompts to link your account and deploy instantly for free.

---

## 🎮 Features & Gameplay

1. **UFOV Levels Matrix**:
   - Features a 15-level progressive campaign across 3 distinct environmental stages (Barren Desert, Farmland Pasture with grazing cows, and visual Forest tree lines silhouettes).
   - Radial axes scale dynamically from 8 spoke lanes (24 peripheral slots) to 16 spoke lanes (48 peripheral slots).
2. **9-Vehicle Silhouette Progression**:
   - Implements 8 custom-drawn vintage vehicle shapes (Convertible, Roadster, Coupe, Coupe with Rack, Pickup Truck, Pickup with Rails, Station Wagon, and Panel Van) in a matching slate-blue color palette.
   - Pairs vehicles progressively across levels (ranging from highly distinct shapes to very similar silhouettes, requiring horizontal roofline and trunk angle discrimination).
3. **Two-Down, One-Up Adaptive Speed Engine**:
   - Starts at $500\text{ms}$ at the beginning of any level.
   - Speed decreases (gets faster) **only after two consecutive correct trials** (using precise timing reductions down to a floor of $32\text{ms}$).
   - Any single error immediately increases flash duration by $+40\text{ms}$ (up to a ceiling of $2600\text{ms}$) and resets your streak.
4. **Local Static Noise Masking**:
   - Features a high-contrast static mask that covers the central vehicle and active peripheral coordinates (rather than the full screen), leaving the background landscape visible.
   - The static blocks update at a comfortable rate of $120\text{ms}$ with a fine $4\text{px}$ cell size.
5. **Developer Debug Dashboard**:
   - Skip to any level configuration instantly using the level selector dropdown.
   - Lock flash speed or freeze the stimulus phase to inspect graphics statically.
   - View real-time stats including current distractors, correct streak, active coordinate lanes, and flash speed.
6. **Web Audio Sound Effects**:
   - Uses the Web Audio API to synthesize low-latency sound cues for success, failure, and click ticks.
7. **SVG Performance Progression Graph**:
   - Plots your presentation speed history dynamically as an interactive SVG graph at the end of each session.
