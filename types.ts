
export enum Polarity {
  BLACK = 'BLACK',
  WHITE = 'WHITE'
}

export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector;
  width: number;
  height: number;
  velocity: Vector;
  polarity: Polarity;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  polarity: Polarity;
}

export interface LevelData {
  id: number;
  title: string;
  platforms: Platform[];
  spawnPoint: Vector;
  goal: Vector;
  lorePrompt: string;
}

export interface GameState {
  currentLevel: number;
  player: Entity;
  isGameOver: boolean;
  isLevelComplete: boolean;
  score: number;
  polarity: Polarity;
  narratorMessage: string;
}
