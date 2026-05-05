let gameState = "START"; 
let difficulty = "NORMAL";
let gridSize = 40;
let detectRange = 10;
let treasureX, treasureY;
let timeLeft = 30;
let startTime, pauseTime;
let cols, rows;

// 音頻變數
let bgm;
let osc, envelope;

// 視覺粒子
let particles = [];

// 垃圾話資料庫
const roasts = [
  "時間到，菜就多練！",
  "你在看哪裡？寶藏在你後面它很火。",
  "這難度對你來說還是太早了點嗎？",
  "114514 聽完了你還沒找到？哼哼...",
  "這種程度...你是用腳玩嗎？",
  "下次考慮換個螢幕吧，這對眼睛不好。",
  "我看你還是去玩電流急急棒吧。",
  "如果這是在月球，你已經迷路到外太空了。",
  "這波操作，我看你是來送頭的。",
  "你的雷達是裝飾用的嗎？",
  "太臭了，我是說你的操作技術。"
];
let currentRoast = "";

function preload() {
  // 載入音樂檔案；若不存在也不會阻塞遊戲
  loadSound('114514.mp3', (sound) => {
    bgm = sound;
  }, (err) => {
    console.warn('背景音樂載入失敗，遊戲仍可繼續：', err);
    bgm = null;
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 初始化音效振盪器 (按鈕點擊感)
  osc = new p5.Oscillator('sine');
  envelope = new p5.Envelope();
  envelope.setADSR(0.01, 0.1, 0.1, 0.1);
  envelope.setRange(0.5, 0);
  osc.start();
  osc.amp(0);

  // 初始化裝飾粒子
  for (let i = 0; i < 60; i++) particles.push(new Particle());

  resetGameData();
}

function draw() {
  background(10, 15, 30);
  
  // 背景粒子
  for (let p of particles) { p.update(); p.show(); }

  if (gameState === "START") drawStartMenu();
  else if (gameState === "DIFFICULTY") drawDifficultyMenu();
  else if (gameState === "READY") drawReadyScreen();
  else if (gameState === "PLAY") {
    updateTimer();
    drawRadarGrid();
    drawPauseButton();
  } else if (gameState === "PAUSE") drawPauseMenu();
  else if (gameState === "RESULT") drawEndScreen();
}

// --- 核心功能 ---

function resetGameData() {
  if (difficulty === "EASY") { gridSize = 60; detectRange = 15; }
  else if (difficulty === "NORMAL") { gridSize = 40; detectRange = 10; }
  else if (difficulty === "HARD") { gridSize = 25; detectRange = 7; }
  else if (difficulty === "DOOM") { gridSize = 15; detectRange = 3; }
  
  cols = floor(width / gridSize);
  rows = floor(height / gridSize);
  treasureX = floor(random(cols));
  treasureY = floor(random(rows));
  timeLeft = 30;
}

function updateTimer() {
  let elapsed = floor((millis() - startTime) / 1000);
  timeLeft = 30 - elapsed;
  if (timeLeft <= 0) {
    timeLeft = 0;
    currentRoast = random(roasts);
    gameState = "RESULT";
    playSound(100);
  }
}

function playSound(f) {
  osc.freq(f);
  envelope.play(osc, 0, 0.1);
}

// --- 介面繪製 ---

function drawStartMenu() {
  push();
  textAlign(CENTER, CENTER);
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(0, 200, 255);
  fill(255);
  textSize(width * 0.05);
  text("RADAR SEEKER", width / 2, height * 0.3);
  drawingContext.shadowBlur = 0;
  textSize(16);
  fill(150, 200, 255);
  text("Music: 月に向かって撃て (114514.mp3)", width / 2, height * 0.38);
  pop();

  drawBtn("開始遊戲", width / 2, height * 0.55, 220, 55, () => { 
    gameState = "DIFFICULTY"; 
    playSound(440);
    if (bgm && !bgm.isPlaying()) {
      bgm.loop();
      bgm.setVolume(0.4);
    }
  }, color(0, 120, 255));
  
  drawBtn("遊戲說明", width / 2, height * 0.65, 220, 55, () => { 
    alert("說明：\n1. 滑鼠掃描網格，圓圈變紅代表寶藏在附近。\n2. 點擊正確格子即獲勝。\n3. 音樂如果不響，請先點擊畫面任何地方。");
  }, color(80));
}

function drawDifficultyMenu() {
  fill(255); textAlign(CENTER, CENTER); textSize(30);
  text("選擇探索難度", width / 2, height * 0.2);
  let btnW = 200;
  drawBtn("簡易", width / 2, height * 0.4, btnW, 45, () => { difficulty="EASY"; startGameFlow(); }, color(50, 200, 100));
  drawBtn("普通", width / 2, height * 0.5, btnW, 45, () => { difficulty="NORMAL"; startGameFlow(); }, color(0, 150, 255));
  drawBtn("困難", width / 2, height * 0.6, btnW, 45, () => { difficulty="HARD"; startGameFlow(); }, color(255, 120, 0));
  
  push();
  if (frameCount % 30 < 15) drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(255, 0, 0);
  drawBtn("毀滅模式", width / 2, height * 0.75, btnW, 45, () => { difficulty="DOOM"; startGameFlow(); }, color(150, 0, 0));
  pop();
}

function startGameFlow() {
  resetGameData();
  gameState = "READY";
  playSound(660);
}

function drawReadyScreen() {
  fill(255); textAlign(CENTER, CENTER); textSize(24);
  text(`難度已鎖定：${difficulty}\n準備好要接受垃圾話挑戰了嗎？`, width / 2, height / 2 - 40);
  drawBtn("啟動雷達", width / 2, height / 2 + 60, 200, 55, () => {
    gameState = "PLAY";
    startTime = millis();
    playSound(880);
  }, color(0, 150, 255));
}

function drawRadarGrid() {
  let mGX = floor(mouseX / gridSize);
  let mGY = floor(mouseY / gridSize);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let d = dist(i, j, treasureX, treasureY);
      let mDist = dist(i, j, mGX, mGY);
      if (mDist < 5) {
        let size = map(d, 0, detectRange, gridSize * 0.9, 2, true);
        let r = map(d, 0, detectRange, 255, 50, true);
        fill(r, 50, 255 - r, 200);
        ellipse(i * gridSize + gridSize/2, j * gridSize + gridSize/2, size);
      } else {
        stroke(255, 10); noFill();
        rect(i * gridSize, j * gridSize, gridSize, gridSize);
      }
    }
  }
}

function drawPauseButton() {
  drawBtn("暫停", width - 60, 30, 80, 35, () => { 
    pauseTime = millis(); 
    gameState = "PAUSE"; 
    if (bgm) bgm.pause();
  }, color(100));
  fill(255); textSize(22); text(`⏱ ${timeLeft}`, width / 2, 30);
}

function drawPauseMenu() {
  fill(0, 200); rect(0, 0, width, height);
  fill(255); textAlign(CENTER, CENTER); textSize(30);
  text("系統掛起", width / 2, height * 0.35);
  drawBtn("繼續任務", width / 2, height * 0.5, 200, 50, () => { 
    startTime += (millis() - pauseTime); 
    gameState = "PLAY"; 
    if (bgm) bgm.play();
  }, color(0, 150, 255));
  drawBtn("終止並退出", width / 2, height * 0.62, 200, 50, () => { gameState = "START"; }, color(150, 50, 50));
}

function drawEndScreen() {
  background(10, 20, 40, 240);
  textAlign(CENTER, CENTER);
  if (timeLeft <= 0) {
    fill(255, 50, 50); textSize(48); text("MISSION FAILED", width / 2, height / 2 - 100);
    fill(255, 200, 0); textSize(26); text(`"${currentRoast}"`, width / 2, height / 2 - 30);
  } else {
    fill(0, 255, 150); textSize(48); text("MISSION COMPLETE", width / 2, height / 2 - 80);
    textSize(24); text("這才像樣嘛，挺行的。", width / 2, height / 2 - 20);
  }
  fill(255); textSize(20);
  text(`目標座標：[ ${treasureX} , ${treasureY} ]`, width / 2, height / 2 + 50);
  drawBtn("重新部署", width / 2, height / 2 + 130, 180, 50, () => { gameState = "START"; }, color(0, 120, 255));
}

// --- 按鈕組件 ---
function drawBtn(txt, x, y, w, h, clk, baseC) {
  let hv = mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2;
  push();
  rectMode(CENTER); translate(x, y);
  if (hv) scale(1.05);
  stroke(255, 150);
  fill(hv ? lerpColor(baseC, color(255), 0.3) : baseC);
  rect(0, 0, w, h, 10);
  noStroke(); fill(255); textAlign(CENTER, CENTER); textSize(18); text(txt, 0, 0);
  pop();
  if (hv && mouseIsPressed) { mouseIsPressed = false; clk(); }
}

// --- 粒子背景 ---
class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = random(width); this.y = random(height);
    this.vx = random(-0.4, 0.4); this.vy = random(-0.4, 0.4);
    this.size = random(1, 3); this.alpha = random(50, 150);
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
  }
  show() { noStroke(); fill(100, 200, 255, this.alpha); circle(this.x, this.y, this.size); }
}

function mousePressed() {
  if (gameState === "PLAY") {
    let cx = floor(mouseX / gridSize);
    let cy = floor(mouseY / gridSize);
    if (cx === treasureX && cy === treasureY) { 
      playSound(1200); 
      gameState = "RESULT"; 
    } else { playSound(200); }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); resetGameData(); }