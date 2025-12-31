
import { Polarity, Vector } from '../types';

interface Props {
  ctx: CanvasRenderingContext2D;
  pos: Vector;
  polarity: Polarity;
  isMoving: boolean;
  frame: number;
}

export const drawStickman = ({ ctx, pos, polarity, isMoving, frame }: Props) => {
  const color = polarity === Polarity.BLACK ? '#000' : '#FFF';
  const { x, y } = pos;
  const h = 40;
  const w = 20;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();

  // Head
  ctx.arc(x + w / 2, y + 8, 6, 0, Math.PI * 2);
  
  // Body
  ctx.moveTo(x + w / 2, y + 14);
  ctx.lineTo(x + w / 2, y + 28);

  // Arms
  const armSwing = isMoving ? Math.sin(frame * 0.2) * 10 : 0;
  ctx.moveTo(x + w / 2, y + 18);
  ctx.lineTo(x + w / 2 - 10, y + 22 + armSwing);
  ctx.moveTo(x + w / 2, y + 18);
  ctx.lineTo(x + w / 2 + 10, y + 22 - armSwing);

  // Legs
  const legSwing = isMoving ? Math.cos(frame * 0.2) * 12 : 0;
  ctx.moveTo(x + w / 2, y + 28);
  ctx.lineTo(x + w / 2 - 8, y + 40 + legSwing);
  ctx.moveTo(x + w / 2, y + 28);
  ctx.lineTo(x + w / 2 + 8, y + 40 - legSwing);

  ctx.stroke();
};
