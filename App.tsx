
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Polarity, GameState, Vector } from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  JUMP_FORCE, 
  MOVE_SPEED, 
  LEVELS,
  COYOTE_TIME_FRAMES,
  JUMP_BUFFER_FRAMES
} from './constants';
import { geminiService } from './services/geminiService';
import { drawStickman } from './components/StickmanRenderer';
import { Play, RotateCcw, ChevronRight, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 0,
    player: {
      id: 'player',
      pos: { ...LEVELS[0].spawnPoint },
      width: 20,
      height: 40,
      velocity: { x: 0, y: 0 },
      polarity: Polarity.BLACK
    },
    isGameOver: false,
    isLevelComplete: false,
    score: 0,
    polarity: Polarity.BLACK,
    narratorMessage: "The path is clear... for now."
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [frame, setFrame] = useState(0);
  const [deathsInLevel, setDeathsInLevel] = useState(0);
  
  // Ref-based state for physics to avoid closure issues in rAF
  const coyoteTimerRef = useRef(0);
  const jumpBufferRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const currentLevelData = LEVELS[gameState.currentLevel];

  const updateNarration = useCallback(async (context: string) => {
    const msg = await geminiService.getNarratorMessage(context);
    setGameState(prev => ({ ...prev, narratorMessage: msg }));
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const context = deathsInLevel > 2 
        ? `${currentLevelData.lorePrompt}. The player has died ${deathsInLevel} times here, give them a helpful hint about jumping and polarity.`
        : currentLevelData.lorePrompt;
      updateNarration(context);
    }
  }, [gameState.currentLevel, isPlaying, deathsInLevel, currentLevelData.lorePrompt, updateNarration]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({ ...prev, [e.code]: true }));
    if (e.code === 'Space') {
      setGameState(prev => ({
        ...prev,
        polarity: prev.polarity === Polarity.BLACK ? Polarity.WHITE : Polarity.BLACK
      }));
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      jumpBufferRef.current = JUMP_BUFFER_FRAMES;
    }
    if (e.code === 'KeyR') {
      resetPlayer(gameState.currentLevel);
    }
  }, [gameState.currentLevel]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({ ...prev, [e.code]: false }));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const resetPlayer = (levelIndex: number) => {
    const level = LEVELS[levelIndex];
    setGameState(prev => ({
      ...prev,
      currentLevel: levelIndex,
      player: {
        ...prev.player,
        pos: { ...level.spawnPoint },
        velocity: { x: 0, y: 0 }
      },
      isGameOver: false,
      isLevelComplete: false,
      polarity: Polarity.BLACK
    }));
    coyoteTimerRef.current = 0;
    jumpBufferRef.current = 0;
  };

  const update = useCallback(() => {
    setGameState(prev => {
      if (prev.isGameOver || prev.isLevelComplete) return prev;

      const player = { ...prev.player };
      const level = LEVELS[prev.currentLevel];

      // Horizontal Movement
      if (keys['ArrowLeft'] || keys['KeyA']) player.velocity.x = -MOVE_SPEED;
      else if (keys['ArrowRight'] || keys['KeyD']) player.velocity.x = MOVE_SPEED;
      else player.velocity.x = 0;

      // Gravity
      player.velocity.y += GRAVITY;

      // Potential Next Position
      const nextX = player.pos.x + player.velocity.x;
      const nextY = player.pos.y + player.velocity.y;

      // Collision Detection
      let currentlyOnGround = false;
      level.platforms.forEach(plat => {
        if (plat.polarity === prev.polarity) {
          if (
            nextY + player.height > plat.y &&
            nextY < plat.y + plat.height &&
            nextX + player.width > plat.x &&
            nextX < plat.x + plat.width
          ) {
            // Landing on top
            if (player.velocity.y >= 0 && player.pos.y + player.height <= plat.y + 5) {
              player.pos.y = plat.y - player.height;
              player.velocity.y = 0;
              currentlyOnGround = true;
            }
          }
        }
      });

      // Update Coyote Time
      if (currentlyOnGround) {
        coyoteTimerRef.current = COYOTE_TIME_FRAMES;
      } else {
        coyoteTimerRef.current = Math.max(0, coyoteTimerRef.current - 1);
      }

      // Handle Jump (with Coyote Time and Jump Buffering)
      if (jumpBufferRef.current > 0 && coyoteTimerRef.current > 0) {
        player.velocity.y = JUMP_FORCE;
        coyoteTimerRef.current = 0;
        jumpBufferRef.current = 0;
      }

      // Decrement Jump Buffer
      jumpBufferRef.current = Math.max(0, jumpBufferRef.current - 1);

      // Apply Final Velocities
      player.pos.x += player.velocity.x;
      player.pos.y += player.velocity.y;

      // Screen Boundaries
      if (player.pos.x < 0) player.pos.x = 0;
      if (player.pos.x + player.width > CANVAS_WIDTH) player.pos.x = CANVAS_WIDTH - player.width;

      // Death condition (Fall off)
      if (player.pos.y > CANVAS_HEIGHT) {
        setDeathsInLevel(d => d + 1);
        return { ...prev, isGameOver: true };
      }

      // Goal detection
      const dx = (player.pos.x + player.width/2) - level.goal.x;
      const dy = (player.pos.y + player.height/2) - level.goal.y;
      if (Math.sqrt(dx*dx + dy*dy) < 40) {
        setDeathsInLevel(0);
        return { ...prev, isLevelComplete: true };
      }

      return { ...prev, player };
    });

    setFrame(f => f + 1);
    requestRef.current = requestAnimationFrame(update);
  }, [keys]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, update]);

  // Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = gameState.polarity === Polarity.BLACK ? '#FFF' : '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    currentLevelData.platforms.forEach(plat => {
      ctx.fillStyle = plat.polarity === Polarity.BLACK ? '#000' : '#FFF';
      if (plat.polarity === gameState.polarity) {
        ctx.globalAlpha = 0.15; // Slightly more visible than before
      } else {
        ctx.globalAlpha = 1.0;
      }
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      ctx.globalAlpha = 1.0;
      
      if (plat.polarity === gameState.polarity) {
        ctx.strokeStyle = plat.polarity === Polarity.BLACK ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        ctx.setLineDash([]);
      }
    });

    ctx.lineWidth = 2;
    ctx.strokeStyle = gameState.polarity === Polarity.BLACK ? '#000' : '#FFF';
    ctx.beginPath();
    ctx.arc(currentLevelData.goal.x, currentLevelData.goal.y, 20 + Math.sin(frame * 0.1) * 5, 0, Math.PI * 2);
    ctx.stroke();

    drawStickman({
      ctx,
      pos: gameState.player.pos,
      polarity: gameState.polarity,
      isMoving: Math.abs(gameState.player.velocity.x) > 0.1,
      frame
    });
  }, [gameState, frame, currentLevelData]);

  const handleNextLevel = () => {
    if (gameState.currentLevel < LEVELS.length - 1) {
      resetPlayer(gameState.currentLevel + 1);
    } else {
      setIsPlaying(false);
      setGameState(prev => ({ ...prev, currentLevel: 0, narratorMessage: "A cycle completed. A balance found." }));
    }
  };

  if (!isPlaying) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-8 animate-in fade-in duration-1000">
          <h1 className="text-7xl font-bold tracking-tighter font-mono border-b-4 border-white pb-4">MONOCHROME</h1>
          <p className="text-xl text-gray-400 font-mono italic">"The gap is only as wide as your doubt."</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-6 border border-gray-800 rounded-lg hover:border-white transition-colors group">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-2">
                <HelpCircle className="w-5 h-5" /> The Mechanics
              </h3>
              <ul className="text-sm text-gray-400 space-y-2 group-hover:text-gray-200">
                <li>• Arrows / WASD: Movement</li>
                <li>• Space: Jump & Switch Polarity</li>
                <li>• Match your color to the ground</li>
              </ul>
            </div>
            <div className="p-6 border border-gray-800 rounded-lg hover:border-white transition-colors group">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-2">
                <ChevronRight className="w-5 h-5" /> Pro Tip
              </h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-200">
                You can still jump for a split second after walking off an edge. Use this to clear long gaps!
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsPlaying(true)}
            className="group relative px-12 py-4 bg-white text-black font-bold text-xl hover:bg-gray-200 transition-all flex items-center gap-2 mx-auto"
          >
            <Play className="fill-current" />
            ENTER THE DIVIDE
            <div className="absolute inset-0 border-2 border-white translate-x-2 translate-y-2 -z-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-center p-4 ${gameState.polarity === Polarity.BLACK ? 'bg-white' : 'bg-black'}`}>
      
      <div className="w-full max-w-[800px] flex justify-between items-end mb-4 font-mono">
        <div className={`space-y-1 ${gameState.polarity === Polarity.BLACK ? 'text-black' : 'text-white'}`}>
          <div className="text-xs uppercase opacity-50 font-bold">Phase {currentLevelData.id}</div>
          <div className="text-2xl font-bold tracking-widest">{currentLevelData.title}</div>
        </div>
        <div className={`text-right ${gameState.polarity === Polarity.BLACK ? 'text-black' : 'text-white'}`}>
          <div className="text-xs uppercase opacity-50 font-bold">Essence</div>
          <div className="text-lg font-bold uppercase tracking-widest">{gameState.polarity}</div>
        </div>
      </div>

      <div className="relative border-8 border-gray-900 shadow-2xl rounded-sm overflow-hidden">
        <canvas 
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block"
        />

        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-6">
            <h2 className="text-6xl font-mono font-bold tracking-tighter text-white">DISSOLVED</h2>
            <p className="text-gray-400 font-mono italic">"{gameState.narratorMessage}"</p>
            <button 
              onClick={() => resetPlayer(gameState.currentLevel)}
              className="flex items-center gap-2 bg-white text-black px-10 py-4 font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> RECONSTRUCT
            </button>
          </div>
        )}

        {gameState.isLevelComplete && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-black space-y-6">
            <h2 className="text-6xl font-mono font-bold tracking-tighter">ASCENDED</h2>
            <p className="italic font-mono text-gray-600">"{gameState.narratorMessage}"</p>
            <button 
              onClick={handleNextLevel}
              className="flex items-center gap-2 bg-black text-white px-10 py-4 font-bold hover:bg-gray-800 transition-all active:scale-95"
            >
              NEXT PHASE <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[800px] mt-8 p-6 border-t-2 border-gray-200/20 flex flex-col items-center text-center">
        <div className={`font-mono italic text-xl min-h-[3rem] flex items-center transition-all duration-1000 ${gameState.polarity === Polarity.BLACK ? 'text-black' : 'text-white'}`}>
          {gameState.narratorMessage}
        </div>
        <div className="mt-6 flex gap-8 text-[11px] uppercase tracking-[0.2em] font-bold opacity-40 font-mono">
          <span className={gameState.polarity === Polarity.BLACK ? 'text-black' : 'text-white'}>WASD/ARROWS: MOVE</span>
          <span className={gameState.polarity === Polarity.BLACK ? 'text-black' : 'text-white'}>SPACE: SHIFT & JUMP</span>
          <span className={gameState.polarity === Polarity.BLACK ? 'text-black' : 'text-white'}>R: RESET</span>
        </div>
      </div>
    </div>
  );
};

export default App;
