import { collides, isRingFull, normalizeAngle, TAU } from "./orbit.ts";

// Orbit: click or press space to launch a satellite onto the spinning ring.
// Land it away from every satellite already there --- touch one and the round
// ends. Fill the ring and the next round starts tighter and faster.

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;
const scoreEl = document.querySelector<HTMLElement>("#score")!;

const LAUNCH_ANGLE = Math.PI / 2; // bottom of the ring, screen space
const START_MIN_SEPARATION = 0.85;
const MIN_SEPARATION_FLOOR = 0.22;
const SEPARATION_DECAY = 0.82;
const START_ROTATION_SPEED = 0.5; // rad/sec
const ROTATION_SPEED_GROWTH = 1.15;
const SHAKE_MS = 420;
const FLASH_MS = 260;
const WIN_ROUNDS = 5;

type Status = "playing" | "gameover" | "win";

interface Star {
  x: number;
  y: number;
  r: number;
  twinkle: number;
}

interface Spark {
  angle: number;
  life: number; // 1 -> 0
}

let width = 0;
let height = 0;
let center = { x: 0, y: 0 };
let ringRadius = 0;
let stars: Star[] = [];

let rotationOffset = 0;
let rotationSpeed = START_ROTATION_SPEED;
let minSeparation = START_MIN_SEPARATION;
let satellites: number[] = [];
let score = 0;
let round = 1;
let status: Status = "playing";
let flashUntil = 0;
let shakeUntil = 0;
let sparks: Spark[] = [];
let failedAngle: number | null = null;

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  center = { x: width / 2, y: height / 2 };
  ringRadius = Math.min(width, height) * 0.32;
  if (stars.length === 0) seedStars();
}

function seedStars() {
  stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.6 + 0.3,
    twinkle: Math.random() * TAU,
  }));
}

function reset() {
  rotationOffset = 0;
  rotationSpeed = START_ROTATION_SPEED;
  minSeparation = START_MIN_SEPARATION;
  satellites = [];
  score = 0;
  round = 1;
  sparks = [];
  failedAngle = null;
  status = "playing";
}

function fire() {
  if (status === "gameover" || status === "win") {
    reset();
    return;
  }

  const ringAngle = normalizeAngle(LAUNCH_ANGLE - rotationOffset);

  if (collides(satellites, ringAngle, minSeparation)) {
    status = "gameover";
    failedAngle = ringAngle;
    const now = performance.now();
    shakeUntil = now + SHAKE_MS;
    sparks = Array.from({ length: 18 }, () => ({
      angle: Math.random() * TAU,
      life: 1,
    }));
    return;
  }

  satellites.push(ringAngle);
  score++;

  if (isRingFull(satellites.length, minSeparation)) {
    if (round >= WIN_ROUNDS) {
      status = "win";
      const now = performance.now();
      flashUntil = now + FLASH_MS;
      sparks = Array.from({ length: 28 }, () => ({
        angle: Math.random() * TAU,
        life: 1,
      }));
      return;
    }
    round++;
    satellites = [];
    minSeparation = Math.max(MIN_SEPARATION_FLOOR, minSeparation * SEPARATION_DECAY);
    rotationSpeed *= ROTATION_SPEED_GROWTH;
    flashUntil = performance.now() + FLASH_MS;
  }
}

// Draws the actual hit zone, not a stand-in dot: this wedge's angular width
// is minSeparation, so two wedges edge-to-edge on screen means exactly the
// legal, tightest-possible fit --- what you see is what fire() checks.
function drawWedge(
  ringAngleLocal: number,
  halfWidth: number,
  fillStyle: string,
  strokeStyle: string | null,
) {
  const screenAngle = ringAngleLocal + rotationOffset;
  const start = screenAngle - halfWidth;
  const end = screenAngle + halfWidth;
  const inner = ringRadius - 12;
  const outer = ringRadius + 12;
  ctx.beginPath();
  ctx.arc(center.x, center.y, outer, start, end);
  ctx.arc(center.x, center.y, inner, end, start, true);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function draw(now: number) {
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createRadialGradient(
    center.x,
    center.y,
    0,
    center.x,
    center.y,
    Math.max(width, height) * 0.7,
  );
  bg.addColorStop(0, "#0c1330");
  bg.addColorStop(1, "#030512");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  for (const star of stars) {
    const twinkle = 0.55 + 0.45 * Math.sin(now / 600 + star.twinkle);
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = "#cfe0ff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  let shakeX = 0;
  let shakeY = 0;
  if (now < shakeUntil) {
    const t = (shakeUntil - now) / SHAKE_MS;
    shakeX = (Math.random() - 0.5) * 10 * t;
    shakeY = (Math.random() - 0.5) * 10 * t;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  const planetRadius = ringRadius * 0.34;
  const planetGradient = ctx.createRadialGradient(
    center.x - planetRadius * 0.3,
    center.y - planetRadius * 0.3,
    planetRadius * 0.1,
    center.x,
    center.y,
    planetRadius,
  );
  planetGradient.addColorStop(0, "#9db9ff");
  planetGradient.addColorStop(
    1,
    status === "gameover" ? "#5a2036" : status === "win" ? "#8a6a1a" : "#274a7a",
  );
  ctx.fillStyle = planetGradient;
  ctx.beginPath();
  ctx.arc(center.x, center.y, planetRadius, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(140, 170, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, ringRadius, 0, TAU);
  ctx.stroke();

  if (now < flashUntil) {
    ctx.strokeStyle = `rgba(150, 255, 210, ${(flashUntil - now) / FLASH_MS})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(center.x, center.y, ringRadius, 0, TAU);
    ctx.stroke();
  }

  const halfWidth = minSeparation / 2;
  for (const ringAngle of satellites) {
    drawWedge(ringAngle, halfWidth, "rgba(143, 227, 199, 0.85)", "rgba(200, 255, 235, 0.9)");
  }

  if (status === "playing") {
    const previewAngle = normalizeAngle(LAUNCH_ANGLE - rotationOffset);
    drawWedge(previewAngle, halfWidth, "rgba(255, 214, 120, 0.22)", "rgba(255, 214, 120, 0.8)");
  } else if (status === "gameover" && failedAngle !== null) {
    // The shot that lost the round, left on screen overlapping the wedge it
    // clipped --- so the overlap that caused the loss is visible, not just
    // asserted by the shake and sparks.
    drawWedge(failedAngle, halfWidth, "rgba(255, 122, 92, 0.55)", "rgba(255, 170, 140, 0.9)");
  }

  sparks = sparks.filter((spark) => spark.life > 0);
  for (const spark of sparks) {
    spark.life -= 0.035;
    const dist = ringRadius * (1 + (1 - spark.life) * 0.6);
    const x = center.x + Math.cos(spark.angle) * dist;
    const y = center.y + Math.sin(spark.angle) * dist;
    ctx.globalAlpha = Math.max(0, spark.life);
    ctx.fillStyle = status === "win" ? "#ffd678" : "#ff7a5c";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const padX = center.x + Math.cos(LAUNCH_ANGLE) * ringRadius;
  const padY = center.y + Math.sin(LAUNCH_ANGLE) * ringRadius;
  const outerX = center.x + Math.cos(LAUNCH_ANGLE) * (ringRadius + 34);
  const outerY = center.y + Math.sin(LAUNCH_ANGLE) * (ringRadius + 34);

  ctx.strokeStyle = "rgba(255, 214, 120, 0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(outerX, outerY);
  ctx.lineTo(padX, padY);
  ctx.stroke();

  const pulse = status === "playing" ? 0.65 + 0.35 * Math.sin(now / 260) : 0.5;
  ctx.fillStyle =
    status === "gameover"
      ? "rgba(255,255,255,0.25)"
      : status === "win"
        ? "rgba(255, 214, 120, 0.9)"
        : `rgba(255, 214, 120, ${pulse})`;
  ctx.beginPath();
  ctx.arc(outerX, outerY, 5, 0, TAU);
  ctx.fill();

  ctx.restore();
}

let lastFrame = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (status === "playing") {
    rotationOffset = normalizeAngle(rotationOffset + rotationSpeed * dt);
  }
  draw(now);
  scoreEl.textContent = String(score);
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  fire();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    fire();
  }
});

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
