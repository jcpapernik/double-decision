# Double Decision - Cognitive Useful Field of View (UFOV) Trainer

A responsive, high-performance web clone of BrainHQ's classic cognitive game **Double Decision**, built with HTML5 Canvas and Vanilla JavaScript. It is designed to train speed of processing and expand your **Useful Field of View (UFOV)**.

---

## 🎮 Play Online

You can play the game instantly in your browser here:
👉 **[jcpapernik.github.io/double-decision](https://jcpapernik.github.io/double-decision/)**

---

## 🧠 How to Play

Double Decision is a cognitive exercise that challenges both your central and peripheral visual systems under brief exposure times:

1. **The Flash**:
   - Click **Start Session** to begin.
   - A central vehicle and a peripheral road sign will flash briefly on the screen, followed immediately by a visual static mask.
2. **Double Choice Response**:
   - **Central Choice**: Click the vehicle you saw in the center of the screen from the two choices displayed.
   - **Peripheral Choice**: Click the lane/direction where the yellow road sign was displayed.
3. **Adaptive Speed Timing**:
   - The flash duration starts at $500\text{ms}$.
   - If you get both selections correct twice in a row, the flash duration decreases (gets faster).
   - If you make a mistake, the flash duration immediately increases (gets slower), adapting dynamically to your visual processing speed.

---

## ⭐ Features

* **15 Progressive Levels**: Play through three distinct scenic stages (Barren Desert, Farmland Pasture, and Forest silhouettes) with increasing peripheral clutter (decoys) and expanding coordinate spokes (from 8 to 16 directions).
* **9 Unique Vintage Vehicle Pairs**: Differentiate between 8 custom-styled vintage cars (Convertible, Roadster, Coupe, Coupe with Rack, Pickup Truck, Pickup with Rails, Station Wagon, and Panel Van). The pairs become increasingly similar as you progress.
* **SVG Session Summary Graph**: Instantly view and track your speed history plotted dynamically on a line graph after each session.
* **Daily Leaderboard**: Tracks daily high scores, peak processing speeds, and accuracy rates, saved locally to your device.
* **Visual Aids**: Toggle helper grid lines in the side HUD to assist in mapping visual lanes to peripheral regions.
