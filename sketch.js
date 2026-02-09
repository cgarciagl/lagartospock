let objetos = [];
let CuantosObjetos = 100;
let terminado = false;
let pausado = false;
let lastUIUpdate = 0;
let gameMode = 'rpsls'; // 'rps' or 'rpsls'
const tamanio = 24;

const typesByMode = {
  rps: ["piedra", "papel", "tijeras"],
  rpsls: ["piedra", "papel", "tijeras", "lagarto", "spock"]
};

// Cache for DOM elements
let domCounts = {};
let domBars = {};
let btnPauseText, btnPauseIcon;

let counts = {
  piedra: 0,
  papel: 0,
  tijeras: 0,
  lagarto: 0,
  spock: 0,
};

const reglas = {
  piedra: { papel: "papel", tijeras: "piedra", lagarto: "piedra", spock: "spock", },
  papel: { tijeras: "tijeras", piedra: "papel", lagarto: "lagarto", spock: "papel", },
  tijeras: { piedra: "piedra", papel: "tijeras", lagarto: "tijeras", spock: "spock", },
  lagarto: { piedra: "piedra", papel: "lagarto", tijeras: "tijeras", spock: "lagarto", },
  spock: { piedra: "spock", papel: "papel", tijeras: "spock", lagarto: "lagarto", },
};

const colors = {
  piedra: '#00d4ff',
  papel: '#fde047',
  tijeras: '#ef4444',
  lagarto: '#22c55e',
  spock: '#a855f7'
};

let history = { piedra: [], papel: [], tijeras: [], lagarto: [], spock: [] };

function setup() {
  const container = document.getElementById('canvas-container');
  const w = Math.min(windowWidth - 20, 1200);
  const h = Math.min(windowHeight * 0.7, 800);
  const canvas = createCanvas(w, h);
  canvas.parent('canvas-container');
  
  // Cache DOM elements
  ['piedra', 'papel', 'tijeras', 'lagarto', 'spock'].forEach(key => {
    domCounts[key] = document.getElementById(`count-${key}`);
    domBars[key] = document.getElementById(`bar-${key}`);
  });
  btnPauseText = document.getElementById('pause-text');
  btnPauseIcon = document.getElementById('pause-icon');

  // Setup buttons and selectors
  document.getElementById('reset-btn').addEventListener('click', resetSimulation);
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  
  const modeSelect = document.getElementById('game-mode');
  modeSelect.addEventListener('change', (e) => {
    gameMode = e.target.value;
    updateUIVisibility();
    resetSimulation();
  });

  updateUIVisibility();
  initSimulation();
}

function updateUIVisibility() {
  const isRPSLS = gameMode === 'rpsls';
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
  objetos = [];
  terminado = false;
  
  // Reset counts to 0 initially
  counts = { piedra: 0, papel: 0, tijeras: 0, lagarto: 0, spock: 0 };
  
  history = { piedra: [], papel: [], tijeras: [], lagarto: [], spock: [] };
  const availableTypes = typesByMode[gameMode];
  
  for (let i = 0; i < CuantosObjetos; i++) {
    objetos.push(new Objeto(random(availableTypes)));
  }
}

function resetSimulation() {
  initSimulation();
  if (pausado) togglePause();
}

function togglePause() {
  pausado = !pausado;
  if (btnPauseText) btnPauseText.innerText = pausado ? "Reanudar" : "Pausar";
  if (btnPauseIcon) btnPauseIcon.innerText = pausado ? "▶️" : "⏸️";
}

function windowResized() {
  const w = Math.min(windowWidth - 20, 1200);
  const h = Math.min(windowHeight * 0.7, 800);
  resizeCanvas(w, h);
}

function draw() {
  background('#111827');
  
  if (!pausado) {
    updateCountersAndCollisions();
    updateHistory();
  } else {
    for (let i = 0; i < objetos.length; i++) {
      objetos[i].show();
    }
  }
  
  drawGraph();
  
  // Throttle UI updates to ~10 times per second
  if (millis() - lastUIUpdate > 100) {
    updateUI();
    lastUIUpdate = millis();
  }
}

class Objeto {
  constructor(tipo) {
    this.x = random(tamanio, width - tamanio);
    this.y = random(tamanio, height - tamanio);
    this.velX = random(-2, 2);
    this.velY = random(-2, 2);
    this.tipo = tipo || random(typesByMode[gameMode]);
    this.tamaño = tamanio;
  }

  move() {
    this.x += this.velX;
    this.y += this.velY;
  }

  show() {
    textSize(this.tamaño);
    textAlign(CENTER, CENTER);
    const simbolos = {
      piedra: "💎",
      papel: "📜",
      tijeras: "✂️",
      lagarto: "🦎",
      spock: "👽",
    };
    
    // Subtle glow based on type
    // drawingContext.shadowBlur = 10;
    // drawingContext.shadowColor = colors[this.tipo];
    
    text(simbolos[this.tipo], this.x, this.y);
    
    // drawingContext.shadowBlur = 0;
  }

  bounce() {
    if (this.x <= this.tamaño/2 || this.x >= width - this.tamaño/2) {
      this.velX *= -1;
      this.x = constrain(this.x, this.tamaño/2, width - this.tamaño/2);
    }
    if (this.y <= this.tamaño/2 || this.y >= height - this.tamaño/2) {
      this.velY *= -1;
      this.y = constrain(this.y, this.tamaño/2, height - this.tamaño/2);
    }
  }

  checkCollision(otroObjeto) {
    return dist(this.x, this.y, otroObjeto.x, otroObjeto.y) < this.tamaño * 0.8;
  }

  bounceWith(otroObjeto) {
    [this.velX, otroObjeto.velX] = [otroObjeto.velX, this.velX];
    [this.velY, otroObjeto.velY] = [otroObjeto.velY, this.velY];

    let overlap = this.tamaño * 0.8 - dist(this.x, this.y, otroObjeto.x, otroObjeto.y);
    if (overlap > 0) {
      let angle = atan2(this.y - otroObjeto.y, this.x - otroObjeto.x);
      let moveX = (cos(angle) * overlap) / 2;
      let moveY = (sin(angle) * overlap) / 2;

      this.x += moveX;
      this.y += moveY;
      otroObjeto.x -= moveX;
      otroObjeto.y -= moveY;
    }
  }

  updateType(otroObjeto) {
    if (this.tipo === otroObjeto.tipo) return;
    const ganador = reglas[this.tipo][otroObjeto.tipo];
    if (ganador) {
      this.tipo = ganador;
      otroObjeto.tipo = ganador;
    }
  }
}

function updateCountersAndCollisions() {
  const boundary = new Rectangle(width/2, height/2, width, height);
  const quadtree = new QuadTree(boundary, 4);

  // Update and insert in one pass
  for (let i = 0; i < objetos.length; i++) {
    const obj = objetos[i];
    obj.move();
    obj.bounce();
    obj.show();
    quadtree.insert(new Point(obj.x, obj.y, obj));
  }

  // Pre-calculate collision range (cache object properties)
  const collSize = tamanio * 0.8;

  for (let i = 0; i < objetos.length; i++) {
    const objeto1 = objetos[i];
    const range = new Circle(objeto1.x, objeto1.y, collSize);
    const points = quadtree.query(range);

    for (let j = 0; j < points.length; j++) {
      const objeto2 = points[j].userData;
      if (objeto1 !== objeto2 && objeto1.checkCollision(objeto2)) {
        objeto1.updateType(objeto2);
        objeto1.bounceWith(objeto2);
      }
    }
  }

  updateCounters();
}

function updateCounters() {
  counts = { piedra: 0, papel: 0, tijeras: 0, lagarto: 0, spock: 0 };
  for (let obj of objetos) {
    counts[obj.tipo]++;
  }
}

function updateUI() {
  // Update numbers and bars using cached elements
  for (let key in counts) {
    const countVal = counts[key];
    const el = domCounts[key];
    if (el) el.innerText = countVal;
    
    const bar = domBars[key];
    if (bar) {
      const percentage = (countVal / CuantosObjetos) * 100;
      bar.style.width = `${percentage}%`;
    }

    if (countVal === CuantosObjetos) {
      terminado = true;
    }
  }
}

function updateHistory() {
  if (!terminado && !pausado) {
    history.piedra.push(counts.piedra);
    history.papel.push(counts.papel);
    history.tijeras.push(counts.tijeras);
    history.lagarto.push(counts.lagarto);
    history.spock.push(counts.spock);
    
    // Limit history length to width
    if (history.piedra.length > width) {
       for (let key in history) history[key].shift();
    }
  }
}

function drawGraph() {
  const graphHeight = 100;
  const xStep = width / history.piedra.length;

  noFill();
  strokeWeight(2);
  
  // Draw backdrop for graph
  fill(0, 0, 0, 50);
  noStroke();
  rect(0, height - graphHeight - 10, width, graphHeight + 10);

  drawLineGraph(history.piedra, colors.piedra, xStep, graphHeight);
  drawLineGraph(history.papel, colors.papel, xStep, graphHeight);
  drawLineGraph(history.tijeras, colors.tijeras, xStep, graphHeight);
  
  if (gameMode === 'rpsls') {
    drawLineGraph(history.lagarto, colors.lagarto, xStep, graphHeight);
    drawLineGraph(history.spock, colors.spock, xStep, graphHeight);
  }
}

function drawLineGraph(data, col, xStep, graphHeight) {
  stroke(col);
  noFill();
  beginShape();
  for (let i = 0; i < data.length; i++) {
    let x = i * xStep;
    let y = height - 5 - map(data[i], 0, CuantosObjetos, 0, graphHeight);
    vertex(x, y);
  }
  endShape();
}
