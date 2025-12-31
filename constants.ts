
import { Polarity, LevelData } from './types';

export const GRAVITY = 0.55;
export const JUMP_FORCE = -14;
export const MOVE_SPEED = 5;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

// Buffer frames for "Coyote Time" and "Jump Buffering" (at ~60fps)
export const COYOTE_TIME_FRAMES = 6;
export const JUMP_BUFFER_FRAMES = 6;

export const LEVELS: LevelData[] = [
  {
    id: 1,
    title: "Origins of Shadow",
    spawnPoint: { x: 50, y: 400 },
    goal: { x: 720, y: 100 },
    lorePrompt: "Explain how the world was once one, but now is split into Black and White. The player is struggling to jump, give them a hint about momentum.",
    platforms: [
      { x: 0, y: 450, width: 220, height: 50, polarity: Polarity.BLACK }, // Slightly wider
      { x: 250, y: 380, width: 150, height: 20, polarity: Polarity.WHITE },
      { x: 450, y: 300, width: 150, height: 20, polarity: Polarity.BLACK },
      { x: 650, y: 220, width: 150, height: 20, polarity: Polarity.WHITE },
      { x: 700, y: 150, width: 80, height: 20, polarity: Polarity.BLACK },
    ]
  },
  {
    id: 2,
    title: "Duality's Gate",
    spawnPoint: { x: 50, y: 400 },
    goal: { x: 50, y: 50 },
    lorePrompt: "The player needs to master the flip while in mid-air. Encourage them to trust the void.",
    platforms: [
      { x: 0, y: 450, width: 300, height: 50, polarity: Polarity.BLACK },
      { x: 400, y: 450, width: 400, height: 50, polarity: Polarity.WHITE },
      { x: 600, y: 350, width: 120, height: 20, polarity: Polarity.BLACK },
      { x: 400, y: 250, width: 120, height: 20, polarity: Polarity.WHITE },
      { x: 200, y: 150, width: 120, height: 20, polarity: Polarity.BLACK },
      { x: 50, y: 100, width: 120, height: 20, polarity: Polarity.WHITE },
    ]
  },
  {
    id: 3,
    title: "The Final Void",
    spawnPoint: { x: 400, y: 400 },
    goal: { x: 400, y: 50 },
    lorePrompt: "The ultimate challenge. Remind them that balance is a moving target.",
    platforms: [
      { x: 300, y: 450, width: 200, height: 30, polarity: Polarity.BLACK },
      { x: 100, y: 350, width: 180, height: 20, polarity: Polarity.WHITE },
      { x: 520, y: 350, width: 180, height: 20, polarity: Polarity.WHITE },
      { x: 200, y: 250, width: 400, height: 20, polarity: Polarity.BLACK },
      { x: 350, y: 120, width: 100, height: 20, polarity: Polarity.WHITE },
    ]
  }
];
