import { useRef, useState, type FormEvent, type PointerEvent } from "react";
import { api } from "../services/api";
import Modal from "./Modal";
import styles from "../styles/modal.module.css";

type Point = { x: number; y: number };

function validateRectangle(strokes: Point[][]) {
  const points = strokes.flat();
  if (points.length < 30) return false;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const width = maxX - minX, height = maxY - minY;
  if (width < 80 || height < 60) return false;
  if (width / height < 0.35 || height / width < 0.35) return false;
  const first = points[0], last = points[points.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) > Math.max(35, width * 0.12)) return false;
  const edgeBandX = width * 0.09, edgeBandY = height * 0.09;
  const edgePoints = points.filter(p =>
    p.x - minX < edgeBandX || maxX - p.x < edgeBandX ||
    p.y - minY < edgeBandY || maxY - p.y < edgeBandY
  );
  if (edgePoints.length / points.length < 0.72) return false;
  const cornerRegions = [
    [minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]
  ].map(([cx, cy]) => points.some(p => Math.abs(p.x - cx) < width * 0.16 && Math.abs(p.y - cy) < height * 0.16));
  return cornerRegions.every(Boolean);
}

export default function AdminChallenge({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef<Point[][]>([]);
  const [message, setMessage] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const begin = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    strokes.current.push([]);
  };
  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = pointFromEvent(event);
    const current = strokes.current[strokes.current.length - 1];
    const previous = current[current.length - 1];
    current.push(p);
    ctx.strokeStyle = "#17233d";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (previous) { ctx.moveTo(previous.x, previous.y); ctx.lineTo(p.x, p.y); }
    else ctx.moveTo(p.x, p.y);
    ctx.stroke();
  };
  const end = () => { drawing.current = false; setMessage(""); };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    strokes.current = [];
    setMessage("");
  };

  const submit = () => {
    if (!validateRectangle(strokes.current)) setMessage("the circle should be exactly 3.14");
    else { setUnlocked(true); setMessage(""); }
  };

  const authenticate = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.unlockAdmin(code);
      onAuthenticated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid administrator access code");
    }
  };

  return (
    <Modal title={unlocked ? "Administrator Access" : "Draw a circle to access the admin"} onClose={onClose}>
      {!unlocked ? (
        <div>
          <canvas
            ref={canvasRef}
            width={520}
            height={240}
            className={styles.canvas}
            onPointerDown={begin}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            aria-label="Drawing canvas"
          />
          {message && <p className={styles.error}>{message}</p>}
          <div className={styles.actions}>
            <button type="button" onClick={clear}>Clear Drawing</button>
            <button type="button" className={styles.primary} onClick={submit}>Submit Drawing</button>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={authenticate}>
          <label htmlFor="admin-code">Administrator Access Code</label>
          <input id="admin-code" type="password" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          {message && <p className={styles.error}>{message}</p>}
          <button type="submit" className={styles.primary}>Unlock Admin Panel</button>
        </form>
      )}
    </Modal>
  );
}
