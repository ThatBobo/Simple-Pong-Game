// Simple Pong game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// Paddles
const paddle = {
  width: 12,
  height: 110,
  speed: 6.0,
};
const left = {
  x: 12,
  y: (H - paddle.height) / 2,
  score: 0
};
const right = {
  x: W - paddle.width - 12,
  y: (H - paddle.height) / 2,
  score: 0
};

// Ball
let ball = {
  x: W/2,
  y: H/2,
  r: 8,
  speed: 5,
  vx: 5,
  vy: 2
};

let lastTime = 0;
let paused = false;
let keys = { up:false, down:false };
let mouseY = null;
let resetTimeout = null;

// Initialize ball moving to random direction
function resetBall(towardsLeft=false){
  ball.x = W/2;
  ball.y = H/2;
  ball.speed = 5;
  const angle = (Math.random() * Math.PI/3) - Math.PI/6; // -30..30 deg
  const dir = towardsLeft ? -1 : 1;
  ball.vx = dir * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
  // short pause
  paused = true;
  clearTimeout(resetTimeout);
  resetTimeout = setTimeout(()=> paused = false, 600);
}

function drawNet(){
  ctx.fillStyle = '#333';
  const seg = 14, gap = 8;
  for(let y=0; y<H; y += seg+gap){
    ctx.fillRect(W/2 - 1, y, 2, seg);
  }
}

function draw(){
  // background
  ctx.clearRect(0,0,W,H);

  // net
  drawNet();

  // paddles
  ctx.fillStyle = '#eee';
  ctx.fillRect(left.x, left.y, paddle.width, paddle.height);
  ctx.fillRect(right.x, right.y, paddle.width, paddle.height);

  // ball
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fill();

  // scores
  ctx.fillStyle = '#ddd';
  ctx.font = '48px system-ui, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(left.score, W*0.25, 60);
  ctx.fillText(right.score, W*0.75, 60);
}

function update(dt){
  if(paused) return;

  // Left paddle: keyboard
  if(keys.up) left.y -= paddle.speed * dt;
  if(keys.down) left.y += paddle.speed * dt;

  // Left paddle: mouse (if present)
  if(mouseY !== null){
    // center paddle on mouse
    left.y = clamp(mouseY - paddle.height/2, 0, H - paddle.height);
  } else {
    left.y = clamp(left.y, 0, H - paddle.height);
  }

  // Simple AI for right paddle
  const rightCenter = right.y + paddle.height / 2;
  const aiSpeed = 4.0 + Math.min(3, ball.speed / 3); // adapt to ball speed slightly
  if(ball.y < rightCenter - 6) right.y -= aiSpeed * dt;
  else if(ball.y > rightCenter + 6) right.y += aiSpeed * dt;
  right.y = clamp(right.y, 0, H - paddle.height);

  // Ball movement
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions (top/bottom)
  if(ball.y - ball.r <= 0){
    ball.y = ball.r;
    ball.vy *= -1;
  } else if(ball.y + ball.r >= H){
    ball.y = H - ball.r;
    ball.vy *= -1;
  }

  // Paddle collisions
  // Left paddle
  if(ball.x - ball.r <= left.x + paddle.width &&
     ball.x - ball.r >= left.x &&
     ball.y >= left.y &&
     ball.y <= left.y + paddle.height){
    // place ball outside paddle to avoid sticking
    ball.x = left.x + paddle.width + ball.r;
    // reflect and change angle depending on hit point
    const relative = (ball.y - (left.y + paddle.height/2));
    const norm = relative / (paddle.height/2);
    const maxBounce = 0.75; // radians
    const bounceAngle = norm * maxBounce;
    const speed = Math.min(12, ball.speed + 0.4);
    ball.vx = Math.abs(Math.cos(bounceAngle) * speed);
    ball.vy = Math.sin(bounceAngle) * speed;
    ball.speed = speed;
  }

  // Right paddle
  if(ball.x + ball.r >= right.x &&
     ball.x + ball.r <= right.x + paddle.width &&
     ball.y >= right.y &&
     ball.y <= right.y + paddle.height){
    ball.x = right.x - ball.r;
    const relative = (ball.y - (right.y + paddle.height/2));
    const norm = relative / (paddle.height/2);
    const maxBounce = 0.75;
    const bounceAngle = norm * maxBounce;
    const speed = Math.min(12, ball.speed + 0.4);
    ball.vx = -Math.abs(Math.cos(bounceAngle) * speed);
    ball.vy = Math.sin(bounceAngle) * speed;
    ball.speed = speed;
  }

  // Score: ball goes out left or right
  if(ball.x < -ball.r){
    // right scores
    right.score += 1;
    resetBall(true); // next move towards left (because right scored)
  } else if(ball.x > W + ball.r){
    left.score += 1;
    resetBall(false);
  }
}

function loop(timestamp){
  if(!lastTime) lastTime = timestamp;
  const dt = Math.min(2, (timestamp - lastTime) / (1000/60)); // normalized for 60fps baseline
  lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Input handlers
window.addEventListener('keydown', (e)=>{
  if(e.key === 'ArrowUp' || e.key === 'Up') { keys.up = true; e.preventDefault(); }
  if(e.key === 'ArrowDown' || e.key === 'Down') { keys.down = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e)=>{
  if(e.key === 'ArrowUp' || e.key === 'Up') keys.up = false;
  if(e.key === 'ArrowDown' || e.key === 'Down') keys.down = false;
});

// Mouse movement inside canvas
canvas.addEventListener('mousemove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  mouseY = e.clientY - rect.top;
  // when using mouse, don't clamp here; update() will clamp
});
canvas.addEventListener('mouseleave', ()=>{ mouseY = null; });

// Start game
resetBall(false);
requestAnimationFrame(loop);

// Optional: allow click to pause/unpause
canvas.addEventListener('click', ()=>{
  paused = !paused;
});
