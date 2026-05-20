// Constants (Magic Numbers and Data)
const CANVAS_MAX_WIDTH = 1200;
const CANVAS_MAX_HEIGHT = 800;
const CANVAS_MARGIN_X = 20;
const CANVAS_MARGIN_Y = 200;
const COLLISION_TOLERANCE = 0.8;
const UI_THROTTLE_MS = 100;
const DEFAULT_OBJECT_SIZE = 24;
const INITIAL_OBJECT_COUNT = 100;
const NORMAL_SPEED_MULTIPLIER = 3.5;
const FINISHED_SPEED_MULTIPLIER = 1.0;

const TYPES_BY_MODE = {
  rps: ["piedra", "papel", "tijeras"],
  rpsls: ["piedra", "papel", "tijeras", "lagarto", "spock"]
};

const RULES = {
  piedra: { papel: "papel", tijeras: "piedra", lagarto: "piedra", spock: "spock", },
  papel: { tijeras: "tijeras", piedra: "papel", lagarto: "lagarto", spock: "papel", },
  tijeras: { piedra: "piedra", papel: "tijeras", lagarto: "tijeras", spock: "spock", },
  lagarto: { piedra: "piedra", papel: "lagarto", tijeras: "tijeras", spock: "lagarto", },
  spock: { piedra: "spock", papel: "papel", tijeras: "spock", lagarto: "lagarto", },
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

// Global State Object
const gameState = {
  objects: [],
  isFinished: false,
  isPaused: false,
  lastUIUpdate: 0,
  gameMode: 'rpsls',
  showGraph: true,
  counts: { piedra: 0, papel: 0, tijeras: 0, lagarto: 0, spock: 0 },
  history: { piedra: [], papel: [], tijeras: [], lagarto: [], spock: [] }
};

// Cache for DOM elements
const domElements = {
  counts: {},
  bars: {},
  btnPauseText: null,
  btnPauseIcon: null
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
    
    // Asignar los íconos dinámicamente desde la variable global EMOJIS
    const iconEl = document.getElementById(`icon-${key}`);
    if (iconEl) iconEl.innerText = EMOJIS[key];
  });
  domElements.btnPauseText = document.getElementById('pause-text');
  domElements.btnPauseIcon = document.getElementById('pause-icon');
}

function setupEventListeners() {
  document.getElementById('reset-btn').addEventListener('click', resetSimulation);
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  
  const graphBtn = document.getElementById('graph-btn');
  if (graphBtn) {
    graphBtn.addEventListener('click', () => {
      gameState.showGraph = !gameState.showGraph;
      graphBtn.classList.toggle('active', gameState.showGraph);
    });
  }
  
  const modeSelect = document.getElementById('game-mode');
  modeSelect.addEventListener('change', (e) => {
    gameState.gameMode = e.target.value;
    updateUIVisibility();
    resetSimulation();
  });
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
  gameState.isFinished = false;
  gameState.counts = { piedra: 0, papel: 0, tijeras: 0, lagarto: 0, spock: 0 };
  gameState.history = { piedra: [], papel: [], tijeras: [], lagarto: [], spock: [] };
  
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

function draw() {
  background('#111827');
  
  if (!gameState.isPaused) {
    updatePhysicsAndCollisions();
    updateCounters();
    // Throttle history updates to every 4 frames (approx. 66ms) for extreme performance gains
    if (frameCount % 4 === 0) {
      updateHistory();
    }
  }
  
  renderObjects();
  drawGraph();
  
  // Throttle UI updates
  if (millis() - gameState.lastUIUpdate > UI_THROTTLE_MS) {
    updateUI();
    gameState.lastUIUpdate = millis();
  }
}

function updatePhysicsAndCollisions() {
  const boundary = new Rectangle(width / 2, height / 2, width, height);
  const quadtree = new QuadTree(boundary, 4);

  // Update physics and insert into QuadTree
  for (const obj of gameState.objects) {
    obj.move();
    obj.bounce();
    quadtree.insert(new Point(obj.x, obj.y, obj));
  }

  // Handle collisions
  const collSize = DEFAULT_OBJECT_SIZE * COLLISION_TOLERANCE;
  for (const obj1 of gameState.objects) {
    const range = new Circle(obj1.x, obj1.y, collSize);
    const points = quadtree.query(range);

    for (const point of points) {
      const obj2 = point.userData;
      // Optimización: Solo resolver si obj1.id < obj2.id (evita redundancia y doble swap de velocidad)
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
  for (const obj of gameState.objects) {
    gameState.counts[obj.type]++;
  }
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

    if (countVal === INITIAL_OBJECT_COUNT) {
      gameState.isFinished = true;
    }
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

  // Pre-calculate y coordinates to avoid redundant linear scaling and function calls
  const yCoords = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    yCoords[i] = height - data[i] * scaleFactor;
  }

  // Draw fill shape using fast linear vertex
  fill(col + '22'); 
  noStroke();
  beginShape();
  vertex(0, height);
  for (let i = 0; i < len; i++) {
    vertex(i * xStep, yCoords[i]);
  }
  vertex((len - 1) * xStep, height);
  endShape(CLOSE);

  // Draw line stroke using fast linear vertex
  stroke(col);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i < len; i++) {
    vertex(i * xStep, yCoords[i]);
  }
  endShape();
}

class Entity {
  constructor(type) {
    this.id = -1; // Se asignará un ID único al inicializar
    this.size = DEFAULT_OBJECT_SIZE;
    this.x = random(this.size, width - this.size);
    this.y = random(this.size, height - this.size);
    
    // Distribuir la velocidad en un círculo para evitar que queden estáticos
    const baseSpeed = random(1.5, 2.5);
    const angle = random(TWO_PI);
    this.velX = cos(angle) * baseSpeed;
    this.velY = sin(angle) * baseSpeed;
    
    this.type = type || random(TYPES_BY_MODE[gameState.gameMode]);
  }

  move() {
    const speedMultiplier = gameState.isFinished ? FINISHED_SPEED_MULTIPLIER : NORMAL_SPEED_MULTIPLIER;
    this.x += this.velX * speedMultiplier;
    this.y += this.velY * speedMultiplier;
  }

  show() {
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
      
      // Vector arithmetic: avoids expensive Math.atan2, Math.cos, Math.sin!
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
      this.type = winner;
      otherEntity.type = winner;
    }
  }
}
