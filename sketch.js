// Constants (Magic Numbers and Data)
const CANVAS_MAX_WIDTH = 1200;
const CANVAS_MAX_HEIGHT = 800;
const CANVAS_MARGIN_X = 20;
const CANVAS_MARGIN_Y = 200;
const COLLISION_TOLERANCE = 0.8;
const UI_THROTTLE_MS = 100;
const DEFAULT_OBJECT_SIZE = 28;
const INITIAL_OBJECT_COUNT = 100;
const NORMAL_SPEED_MULTIPLIER = 3.2;
const FINISHED_SPEED_MULTIPLIER = 1.0;
const PERCEPTION_RADIUS = 75;

const TYPES_BY_MODE = {
  rps: ["piedra", "papel", "tijeras"],
  rpsls: ["piedra", "papel", "tijeras", "lagarto", "spock"]
};

const RULES = {
  piedra: { papel: "papel", tijeras: "piedra", lagarto: "piedra", spock: "spock" },
  papel: { tijeras: "tijeras", piedra: "papel", lagarto: "lagarto", spock: "papel" },
  tijeras: { piedra: "piedra", papel: "tijeras", lagarto: "tijeras", spock: "spock" },
  lagarto: { piedra: "piedra", papel: "lagarto", tijeras: "tijeras", spock: "lagarto" },
  spock: { piedra: "spock", papel: "papel", tijeras: "spock", lagarto: "lagarto" },
};

const COLORS = {
  piedra: '#00d4ff',
  papel: '#fde047',
  tijeras: '#ef4444',
  lagarto: '#22c55e',
  spock: '#a855f7'
};

const EMOJIS = {
  piedra: "🪨",
  papel: "📜",
  tijeras: "✂️",
  lagarto: "🦎",
  spock: "👽",
};

// ============================================================================
// Web Audio API Procedural Sound Controller (Optimized for Mobile & Desktop)
// ============================================================================
class SoundController {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isUnlocked = false;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.isUnlocked) {
      // iOS Web Audio unlock: create and play a 1-sample silent buffer
      try {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      } catch (e) {
        // Ignore if already playing/unlocked
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.unlock();
    }
    return this.isMuted;
  }

  playFeedbackTone() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // Re (D5)
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playHit(winnerType) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (winnerType) {
      case 'piedra': // Golpe grave con armónicos audibles en móviles (260Hz -> 80Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'papel': // Fricción suave y pop (450Hz -> 220Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'tijeras': // Clic metálico agudo (1100Hz -> 650Hz)
        osc.type = 'square';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.07);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
        break;

      case 'lagarto': // Gorjeo reptiliano modulado (320Hz -> 650Hz -> 180Hz)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(650, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'spock': // Efecto sci-fi / láser resonante (950Hz -> 250Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.14);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
    }
  }

  playVictory() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const notes = [329.63, 392.00, 523.25, 659.25, 783.99]; // Acorde mayor E4 - G4 - C5 - E5 - G5
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const noteStart = now + index * 0.09;
      gain.gain.setValueAtTime(0.28, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);
      osc.start(noteStart);
      osc.stop(noteStart + 0.6);
    });
  }
}

// ============================================================================
// Particle System for Combat Feedback
// ============================================================================
class Particle {
  constructor(x, y, colorHex) {
    this.x = x;
    this.y = y;
    const angle = random(TWO_PI);
    const speed = random(1.2, 3.5);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.colorHex = colorHex;
    this.alpha = 240;
    this.size = random(2.5, 5.0);
    this.decay = random(14, 22);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.alpha -= this.decay;
    this.size = Math.max(1, this.size * 0.95);
  }

  draw() {
    noStroke();
    const c = color(this.colorHex);
    fill(red(c), green(c), blue(c), this.alpha);
    circle(this.x, this.y, this.size);
  }

  get isDead() {
    return this.alpha <= 0;
  }
}

// ============================================================================
// Global State Object
// ============================================================================
const soundController = new SoundController();

const gameState = {
  objects: [],
  particles: [],
  isFinished: false,
  isPaused: false,
  aiEnabled: true,
  lastUIUpdate: 0,
  gameMode: 'rpsls',
  showGraph: true,
  startTime: 0,
  totalCombats: 0,
  mvpEntity: null,
  victoryHandled: false,
  counts: { piedra: 0, papel: 0, tijeras: 0, lagarto: 0, spock: 0 },
  history: { piedra: [], papel: [], tijeras: [], lagarto: [], spock: [] }
};

// Cache for DOM elements
const domElements = {
  counts: {},
  bars: {},
  btnPauseText: null,
  btnPauseIcon: null,
  btnSoundText: null,
  btnSoundIcon: null,
  btnAiText: null,
  victoryModal: null
};

function setup() {
  const container = document.getElementById('canvas-container');
  const dims = getCanvasDimensions();
  const canvas = createCanvas(dims.w, dims.h);
  canvas.parent('canvas-container');
  
  cacheDomElements();
  setupEventListeners();

  updateUIVisibility();
  initSimulation();
}

function getCanvasDimensions() {
  return {
    w: Math.min(windowWidth - CANVAS_MARGIN_X, CANVAS_MAX_WIDTH),
    h: Math.min(windowHeight - CANVAS_MARGIN_Y, CANVAS_MAX_HEIGHT)
  };
}

function cacheDomElements() {
  ['piedra', 'papel', 'tijeras', 'lagarto', 'spock'].forEach(key => {
    domElements.counts[key] = document.getElementById(`count-${key}`);
    domElements.bars[key] = document.getElementById(`bar-${key}`);
    
    const iconEl = document.getElementById(`icon-${key}`);
    if (iconEl) iconEl.innerText = EMOJIS[key];
  });
  domElements.btnPauseText = document.getElementById('pause-text');
  domElements.btnPauseIcon = document.getElementById('pause-icon');
  domElements.btnSoundText = document.getElementById('sound-text');
  domElements.btnSoundIcon = document.getElementById('sound-icon');
  domElements.btnAiText = document.getElementById('ai-text');
  domElements.victoryModal = document.getElementById('victory-modal');
}

function setupEventListeners() {
  // Mobile & Desktop multi-event audio unlock
  const unlockEvents = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'click'];
  unlockEvents.forEach(evt => {
    window.addEventListener(evt, () => soundController.unlock(), { passive: true });
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    soundController.unlock();
    resetSimulation();
  });
  
  document.getElementById('pause-btn').addEventListener('click', () => {
    soundController.unlock();
    togglePause();
  });
  
  const graphBtn = document.getElementById('graph-btn');
  if (graphBtn) {
    graphBtn.addEventListener('click', () => {
      soundController.unlock();
      gameState.showGraph = !gameState.showGraph;
      graphBtn.classList.toggle('active', gameState.showGraph);
    });
  }

  const aiBtn = document.getElementById('ai-btn');
  if (aiBtn) {
    aiBtn.addEventListener('click', () => {
      soundController.unlock();
      gameState.aiEnabled = !gameState.aiEnabled;
      aiBtn.classList.toggle('active', gameState.aiEnabled);
      if (domElements.btnAiText) {
        domElements.btnAiText.innerText = gameState.aiEnabled ? "IA: Caza" : "IA: Off";
      }
    });
  }

  const soundBtn = document.getElementById('sound-btn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundController.unlock();
      const isMuted = soundController.toggleMute();
      soundBtn.classList.toggle('active', !isMuted);
      if (domElements.btnSoundIcon) domElements.btnSoundIcon.innerText = isMuted ? "🔇" : "🔊";
      if (domElements.btnSoundText) domElements.btnSoundText.innerText = isMuted ? "Mute" : "Sonido";
      if (!isMuted) {
        soundController.playFeedbackTone();
      }
    });
  }
  
  const modeSelect = document.getElementById('game-mode');
  modeSelect.addEventListener('change', (e) => {
    soundController.unlock();
    gameState.gameMode = e.target.value;
    updateUIVisibility();
    resetSimulation();
  });

  // Modal actions
  const modalResetBtn = document.getElementById('modal-reset-btn');
  if (modalResetBtn) {
    modalResetBtn.addEventListener('click', () => {
      closeVictoryModal();
      resetSimulation();
    });
  }

  const modalScreenshotBtn = document.getElementById('modal-screenshot-btn');
  if (modalScreenshotBtn) {
    modalScreenshotBtn.addEventListener('click', () => {
      saveCanvas('rpsls_victoria_' + Date.now(), 'png');
    });
  }

  const closeModalBtn = document.getElementById('close-modal-btn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeVictoryModal);
  }
}

function updateUIVisibility() {
  const isRPSLS = gameState.gameMode === 'rpsls';
  const lagartoCard = document.getElementById('card-lagarto');
  const spockCard = document.getElementById('card-spock');
  const lagartoBar = document.getElementById('bar-lagarto');
  const spockBar = document.getElementById('bar-spock');

  if (lagartoCard) lagartoCard.classList.toggle('hidden', !isRPSLS);
  if (spockCard) spockCard.classList.toggle('hidden', !isRPSLS);
  if (lagartoBar) lagartoBar.style.display = isRPSLS ? 'block' : 'none';
  if (spockBar) spockBar.style.display = isRPSLS ? 'block' : 'none';
}

function initSimulation() {
  gameState.objects = [];
  gameState.particles = [];
  gameState.isFinished = false;
  gameState.victoryHandled = false;
  gameState.startTime = Date.now();
  gameState.totalCombats = 0;
  gameState.mvpEntity = null;
  gameState.counts = { piedra: 0, papel: 0, tijeras: 0, lagarto: 0, spock: 0 };
  gameState.history = { piedra: [], papel: [], tijeras: [], lagarto: [], spock: [] };
  
  closeVictoryModal();

  const availableTypes = TYPES_BY_MODE[gameState.gameMode];
  
  for (let i = 0; i < INITIAL_OBJECT_COUNT; i++) {
    const entity = new Entity(random(availableTypes));
    entity.id = i;
    gameState.objects.push(entity);
  }
}

function resetSimulation() {
  initSimulation();
  if (gameState.isPaused) togglePause();
}

function togglePause() {
  gameState.isPaused = !gameState.isPaused;
  if (domElements.btnPauseText) domElements.btnPauseText.innerText = gameState.isPaused ? "Reanudar" : "Pausar";
  if (domElements.btnPauseIcon) domElements.btnPauseIcon.innerText = gameState.isPaused ? "▶️" : "⏸️";
}

function windowResized() {
  const dims = getCanvasDimensions();
  resizeCanvas(dims.w, dims.h);
}

function touchStarted() {
  soundController.unlock();
}

function mousePressed() {
  soundController.unlock();
}

function spawnCombatParticles(x, y, colorHex) {
  const count = 7;
  for (let i = 0; i < count; i++) {
    gameState.particles.push(new Particle(x, y, colorHex));
  }
}

function draw() {
  background('#111827');
  
  if (!gameState.isPaused) {
    updatePhysicsAndCollisions();
    updateCounters();
    // Throttle history updates to every 4 frames for optimal performance
    if (frameCount % 4 === 0) {
      updateHistory();
    }
  }
  
  drawGraph();
  renderParticles();
  renderObjects();
  
  // Throttle UI updates
  if (millis() - gameState.lastUIUpdate > UI_THROTTLE_MS) {
    updateUI();
    gameState.lastUIUpdate = millis();
  }
}

function renderParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    if (!gameState.isPaused) {
      p.update();
    }
    p.draw();
    if (p.isDead) {
      gameState.particles.splice(i, 1);
    }
  }
}

function updatePhysicsAndCollisions() {
  const boundary = new Rectangle(width / 2, height / 2, width, height);
  const quadtree = new QuadTree(boundary, 4);

  // Insert all objects into QuadTree first
  for (const obj of gameState.objects) {
    quadtree.insert(new Point(obj.x, obj.y, obj));
  }

  // Handle Steering AI and movement
  for (const obj of gameState.objects) {
    obj.huntAndFlee(quadtree);
    obj.move();
    obj.bounce();
  }

  // Handle collisions using QuadTree
  const collSize = DEFAULT_OBJECT_SIZE * COLLISION_TOLERANCE;
  for (const obj1 of gameState.objects) {
    const range = new Circle(obj1.x, obj1.y, collSize);
    const points = quadtree.query(range);

    for (const point of points) {
      const obj2 = point.userData;
      // Resolve once per pair (obj1.id < obj2.id)
      if (obj1.id < obj2.id && obj1.checkCollision(obj2)) {
        obj1.resolveCombat(obj2);
        obj1.bounceWith(obj2);
      }
    }
  }
}

function renderObjects() {
  for (const obj of gameState.objects) {
    obj.show();
  }
}

function updateCounters() {
  gameState.counts = { piedra: 0, papel: 0, tijeras: 0, lagarto: 0, spock: 0 };
  let topMvp = null;
  let maxKills = 0;

  for (const obj of gameState.objects) {
    gameState.counts[obj.type]++;
    if (obj.conversions > maxKills) {
      maxKills = obj.conversions;
      topMvp = obj;
    }
  }

  gameState.mvpEntity = topMvp;
}

function updateUI() {
  for (const key in gameState.counts) {
    const countVal = gameState.counts[key];
    const el = domElements.counts[key];
    if (el) el.innerText = countVal;
    
    const bar = domElements.bars[key];
    if (bar) {
      const percentage = (countVal / INITIAL_OBJECT_COUNT) * 100;
      bar.style.width = `${percentage}%`;
    }

    if (countVal === INITIAL_OBJECT_COUNT && !gameState.victoryHandled) {
      handleVictory(key);
    }
  }
}

function handleVictory(winningType) {
  gameState.isFinished = true;
  gameState.victoryHandled = true;
  soundController.playVictory();

  const elapsedMs = Date.now() - gameState.startTime;
  const totalSecs = Math.floor(elapsedMs / 1000);
  const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const secs = (totalSecs % 60).toString().padStart(2, '0');
  const formattedTime = `${mins}:${secs}`;

  const iconEl = document.getElementById('winner-icon');
  const nameEl = document.getElementById('winner-name');
  const badgeEl = document.getElementById('winner-badge');
  const durEl = document.getElementById('stat-duration');
  const combEl = document.getElementById('stat-combats');
  const mvpEl = document.getElementById('stat-mvp');
  const mvpKillsEl = document.getElementById('stat-mvp-kills');

  if (iconEl) iconEl.innerText = EMOJIS[winningType];
  if (nameEl) {
    nameEl.innerText = winningType.toUpperCase();
    nameEl.style.color = COLORS[winningType];
  }
  if (badgeEl) {
    badgeEl.style.borderColor = COLORS[winningType];
    badgeEl.style.boxShadow = `0 0 25px ${COLORS[winningType]}44`;
  }
  if (durEl) durEl.innerText = formattedTime;
  if (combEl) combEl.innerText = gameState.totalCombats.toString();
  if (mvpEl) {
    mvpEl.innerText = gameState.mvpEntity ? `${EMOJIS[gameState.mvpEntity.type]} #${gameState.mvpEntity.id}` : "N/A";
  }
  if (mvpKillsEl) {
    mvpKillsEl.innerText = gameState.mvpEntity ? `${gameState.mvpEntity.conversions} combates` : "0";
  }

  if (domElements.victoryModal) {
    domElements.victoryModal.classList.remove('hidden');
  }
}

function closeVictoryModal() {
  if (domElements.victoryModal) {
    domElements.victoryModal.classList.add('hidden');
  }
}

function updateHistory() {
  if (!gameState.isFinished && !gameState.isPaused) {
    gameState.history.piedra.push(gameState.counts.piedra);
    gameState.history.papel.push(gameState.counts.papel);
    gameState.history.tijeras.push(gameState.counts.tijeras);
    gameState.history.lagarto.push(gameState.counts.lagarto);
    gameState.history.spock.push(gameState.counts.spock);
    
    // Limit history length to width / 4 for high-performance shifting and rendering
    const maxHistoryLength = Math.ceil(width / 4);
    if (gameState.history.piedra.length > maxHistoryLength) {
       for (const key in gameState.history) {
          gameState.history[key].shift();
       }
    }
  }
}

function drawGraph() {
  if (!gameState.showGraph) return;
  
  const graphHeight = 120;
  const xStep = width / (gameState.history.piedra.length - 1);

  noStroke();
  
  // Draw backdrop for graph
  fill(15, 23, 42, 100);
  rect(0, height - graphHeight - 20, width, graphHeight + 20);

  // Draw areas
  drawAreaGraph(gameState.history.piedra, COLORS.piedra, xStep, graphHeight);
  drawAreaGraph(gameState.history.papel, COLORS.papel, xStep, graphHeight);
  drawAreaGraph(gameState.history.tijeras, COLORS.tijeras, xStep, graphHeight);
  
  if (gameState.gameMode === 'rpsls') {
    drawAreaGraph(gameState.history.lagarto, COLORS.lagarto, xStep, graphHeight);
    drawAreaGraph(gameState.history.spock, COLORS.spock, xStep, graphHeight);
  }
}

function drawAreaGraph(data, col, xStep, graphHeight) {
  const len = data.length;
  if (len < 2) return;

  const scaleFactor = graphHeight / INITIAL_OBJECT_COUNT;

  // Pre-calculate y coordinates
  const yCoords = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    yCoords[i] = height - data[i] * scaleFactor;
  }

  // Draw fill shape
  fill(col + '22'); 
  noStroke();
  beginShape();
  vertex(0, height);
  for (let i = 0; i < len; i++) {
    vertex(i * xStep, yCoords[i]);
  }
  vertex((len - 1) * xStep, height);
  endShape(CLOSE);

  // Draw line stroke
  stroke(col);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i < len; i++) {
    vertex(i * xStep, yCoords[i]);
  }
  endShape();
}

// ============================================================================
// Entity Class (with Predator/Prey AI and MVP tracker)
// ============================================================================
class Entity {
  constructor(type) {
    this.id = -1;
    this.size = DEFAULT_OBJECT_SIZE;
    this.x = random(this.size, width - this.size);
    this.y = random(this.size, height - this.size);
    this.conversions = 0;
    
    // Distribute initial velocity in a circle
    const baseSpeed = random(1.2, 2.2);
    const angle = random(TWO_PI);
    this.velX = cos(angle) * baseSpeed;
    this.velY = sin(angle) * baseSpeed;
    
    this.type = type || random(TYPES_BY_MODE[gameState.gameMode]);
  }

  huntAndFlee(quadtree) {
    if (!gameState.aiEnabled || gameState.isFinished) return;

    const range = new Circle(this.x, this.y, PERCEPTION_RADIUS);
    const neighbors = quadtree.query(range);

    let steerX = 0;
    let steerY = 0;
    let preyCount = 0;
    let predCount = 0;

    for (const pt of neighbors) {
      const other = pt.userData;
      if (other === this || other.type === this.type) continue;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distSq = dx * dx + dy * dy;
      if (distSq === 0) continue;

      const dist = Math.sqrt(distSq);
      const winner = RULES[this.type][other.type];

      if (winner === this.type) {
        // Caza: atracción moderada hacia la presa
        steerX += (dx / dist) * 0.45;
        steerY += (dy / dist) * 0.45;
        preyCount++;
      } else if (winner === other.type) {
        // Huida: repulsión fuerte del cazador (prioridad supervivencia)
        steerX -= (dx / dist) * 0.95;
        steerY -= (dy / dist) * 0.95;
        predCount++;
      }
    }

    if (preyCount > 0 || predCount > 0) {
      const maxSteer = 0.18;
      const forceX = constrain(steerX, -maxSteer, maxSteer);
      const forceY = constrain(steerY, -maxSteer, maxSteer);

      this.velX += forceX;
      this.velY += forceY;

      // Limit speed
      const speedSq = this.velX * this.velX + this.velY * this.velY;
      const maxSpeed = 2.4;
      if (speedSq > maxSpeed * maxSpeed) {
        const speed = Math.sqrt(speedSq);
        this.velX = (this.velX / speed) * maxSpeed;
        this.velY = (this.velY / speed) * maxSpeed;
      }
    }
  }

  move() {
    const speedMultiplier = gameState.isFinished ? FINISHED_SPEED_MULTIPLIER : NORMAL_SPEED_MULTIPLIER;
    this.x += this.velX * speedMultiplier;
    this.y += this.velY * speedMultiplier;
  }

  show() {
    // Render MVP Crown if leading with at least 3 conversions
    if (this === gameState.mvpEntity && this.conversions >= 3) {
      textSize(this.size * 0.7);
      textAlign(CENTER, CENTER);
      text("👑", this.x, this.y - this.size * 0.75);
    }

    textSize(this.size);
    textAlign(CENTER, CENTER);
    text(EMOJIS[this.type], this.x, this.y);
  }

  bounce() {
    if (this.x <= this.size / 2 || this.x >= width - this.size / 2) {
      this.velX *= -1;
      this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    }
    if (this.y <= this.size / 2 || this.y >= height - this.size / 2) {
      this.velY *= -1;
      this.y = constrain(this.y, this.size / 2, height - this.size / 2);
    }
  }

  checkCollision(otherEntity) {
    const dx = this.x - otherEntity.x;
    const dy = this.y - otherEntity.y;
    const threshold = this.size * COLLISION_TOLERANCE;
    return (dx * dx + dy * dy) < (threshold * threshold);
  }

  bounceWith(otherEntity) {
    // Swap velocities
    [this.velX, otherEntity.velX] = [otherEntity.velX, this.velX];
    [this.velY, otherEntity.velY] = [otherEntity.velY, this.velY];

    // Separate objects to avoid getting stuck
    const dx = this.x - otherEntity.x;
    const dy = this.y - otherEntity.y;
    const distSq = dx * dx + dy * dy;
    const threshold = this.size * COLLISION_TOLERANCE;

    if (distSq < threshold * threshold && distSq > 0) {
      const distance = Math.sqrt(distSq);
      const overlap = threshold - distance;
      
      const moveX = (dx / distance * overlap) / 2;
      const moveY = (dy / distance * overlap) / 2;

      this.x += moveX;
      this.y += moveY;
      otherEntity.x -= moveX;
      otherEntity.y -= moveY;
    }
  }

  resolveCombat(otherEntity) {
    if (this.type === otherEntity.type) return;
    const winner = RULES[this.type][otherEntity.type];
    if (winner) {
      const winnerObj = (this.type === winner) ? this : otherEntity;
      winnerObj.conversions++;
      gameState.totalCombats++;

      // Trigger audio and particles
      soundController.playHit(winner);
      spawnCombatParticles((this.x + otherEntity.x) / 2, (this.y + otherEntity.y) / 2, COLORS[winner]);

      this.type = winner;
      otherEntity.type = winner;
    }
  }
}
