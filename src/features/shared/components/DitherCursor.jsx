import { useEffect, useRef } from "react";

const DitherCursor = ({
  ditherSize = 6,
  radius = 0.04,
  exponent = 2.0,
  decay = 0.015,
  color = "#C8102E",
  intensity = 0.5,
}) => {
  const canvasRef = useRef(null);

  // ── Mutable color ref ────────────────────────────────────────────────────────
  // Lives outside the draw loop so it can be updated by custom events
  // without restarting the entire animation.
  const rgbRef = useRef({ r: 200, g: 16, b: 46 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let mouse = { x: -999, y: -999, velocity: 0 };
    let isMoving = false;
    let moveTimeout = null;
    let grid = [];
    let cols = 0;
    let rows = 0;

    const hexToRgb = (hex) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });

    // Initialise from prop
    rgbRef.current = hexToRgb(color);

    // ── Custom event: any section can fire this to change cursor color ─────────
    // e.g. window.dispatchEvent(new CustomEvent('moodify:cursor-color', { detail: { color: '#F5F0E8' } }))
    const onColorChange = (e) => {
      rgbRef.current = hexToRgb(e.detail.color);
    };
    window.addEventListener("moodify:cursor-color", onColorChange);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / ditherSize);
      rows = Math.ceil(canvas.height / ditherSize);
      grid = new Float32Array(cols * rows).fill(0);
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e) => {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.velocity = Math.sqrt(dx * dx + dy * dy);
      isMoving = true;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => { isMoving = false; }, 150);
    };
    window.addEventListener("mousemove", onMouseMove);

    // Bayer 4×4 dither matrix
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const getBayer = (x, y) =>
      bayer[(y % 4) * 4 + (x % 4)] / 16;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Read current color from ref — updates instantly when event fires
      const { r, g, b } = rgbRef.current;

      const mx = mouse.x;
      const my = mouse.y;
      const maxDist = Math.max(canvas.width, canvas.height) * radius;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * ditherSize + ditherSize / 2;
          const py = row * ditherSize + ditherSize / 2;
          const dx = px - mx;
          const dy = py - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (isMoving && dist < maxDist) {
            const normalized = 1 - dist / maxDist;
            const velocityFactor = Math.min(mouse.velocity / 20, 1);
            const influence = Math.pow(normalized, exponent) * intensity * velocityFactor;
            grid[row * cols + col] = Math.min(1, grid[row * cols + col] + influence);
          }

          grid[row * cols + col] = Math.max(
            0,
            grid[row * cols + col] - (isMoving ? decay : 0.04)
          );

          const threshold = getBayer(col, row);
          const val = grid[row * cols + col];

          if (val > threshold) {
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, val)})`;
            ctx.fillRect(col * ditherSize, row * ditherSize, ditherSize - 1, ditherSize - 1);
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("moodify:cursor-color", onColorChange);
    };
  }, [ditherSize, radius, exponent, decay, color, intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
};

export default DitherCursor;