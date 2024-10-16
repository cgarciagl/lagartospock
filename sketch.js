let objetos = [];
let CuantosObjetos = 100;
let terminado = false;
const tamanio = 10;

let counts = {
  piedra: 0,
  papel: 0,
  tijeras: 0,
  lagarto: 0,
  spock: 0,
};

const reglas = {
  piedra: {
    papel: "papel",
    tijeras: "piedra",
    lagarto: "piedra",
    spock: "spock",
  },
  papel: {
    tijeras: "tijeras",
    piedra: "papel",
    lagarto: "lagarto",
    spock: "papel",
  },
  tijeras: {
    piedra: "piedra",
    papel: "tijeras",
    lagarto: "tijeras",
    spock: "spock",
  },
  lagarto: {
    piedra: "piedra",
    papel: "lagarto",
    tijeras: "tijeras",
    spock: "lagarto",
  },
  spock: {
    piedra: "spock",
    papel: "papel",
    tijeras: "spock",
    lagarto: "lagarto",
  },
};

let history = {
  piedra: [],
  papel: [],
  tijeras: [],
  lagarto: [],
  spock: [],
};

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < CuantosObjetos; i++) {
    let nuevoObjeto = new Objeto();
    objetos.push(nuevoObjeto);
  }
}

function draw() {
  background("White");
  updateCountersAndCollisions();
  updateHistory();
  drawGraph();
  displayCounters();
}

class Objeto {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.velX = random(-3, 3);
    this.velY = random(-3, 3);
    this.tipo = random(["piedra", "papel", "tijeras", "lagarto", "spock"]);
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
      piedra: "🪨",
      papel: "📜",
      tijeras: "✂️",
      lagarto: "🦎",
      spock: "👽",
    };
    text(simbolos[this.tipo], this.x, this.y);
  }

  bounce() {
    if (this.x <= 0 || this.x >= width) {
      this.velX *= -1;
      this.x = constrain(this.x, 0, width);
    }
    if (this.y <= 0 || this.y >= height) {
      this.velY *= -1;
      this.y = constrain(this.y, 0, height);
    }
  }

  checkCollision(otroObjeto) {
    return dist(this.x, this.y, otroObjeto.x, otroObjeto.y) < this.tamaño * 2;
  }

  bounceWith(otroObjeto) {
    [this.velX, otroObjeto.velX] = [otroObjeto.velX, this.velX];
    [this.velY, otroObjeto.velY] = [otroObjeto.velY, this.velY];

    let overlap =
      this.tamaño * 2 - dist(this.x, this.y, otroObjeto.x, otroObjeto.y);
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
    const ganador = reglas[this.tipo][otroObjeto.tipo];
    if (ganador) {
      this.tipo = ganador;
      otroObjeto.tipo = ganador;
    }
  }
}

function displayCounters() {
  textSize(16);
  let labels = ["🪨Piedra", "📜Papel", "✂️Tijeras", "🦎Lagarto", "👽Spock"];
  let values = [
    counts.piedra,
    counts.papel,
    counts.tijeras,
    counts.lagarto,
    counts.spock,
  ];

  let espaciado = width / (labels.length + 1);

  for (let i = 0; i < labels.length; i++) {
    mostrarContador(labels[i], values[i], espaciado * (i + 1), height - 20);
  }
}

function updateCountersAndCollisions() {
  const r = new Rectangle(400, 250, 1000, 1000);
  const capacity = 4;
  const quadtree = new QuadTree(r, capacity);

  updateObjects(quadtree);

  updateCounters();
}

function updateObjects(quadtree) {
  for (let objeto of objetos) {
    objeto.move();
    objeto.show();
    objeto.bounce();
    let p = new Point(objeto.x, objeto.y, objeto);
    quadtree.insert(p);
  }

  objetos.forEach(function (objeto1, i) {
    let c = new Circle(objeto1.x, objeto1.y, objeto1.tamaño * 2);
    let puntos = quadtree.query(c);

    puntos.forEach(function (punto, i) {
      let objeto2 = punto.userData;
      if (objeto2 != objeto1) {
        if (objeto1.checkCollision(objeto2)) {
          objeto1.updateType(objeto2);
          objeto1.bounceWith(objeto2);
        }
      }
    });
  });
}

function updateCounters() {
  //inicializamos los counts en 0
  counts = {
    piedra: 0,
    papel: 0,
    tijeras: 0,
    lagarto: 0,
    spock: 0,
  };

  for (let obj of objetos) {
    counts[obj.tipo]++;
  }
}

function mostrarContador(label, valor, x, y) {
  noStroke();
  fill(255, 222, 173, 150);
  rectMode(CENTER);
  rect(x, y, 115, 20, 10);

  let color =
    valor === 0
      ? "OrangeRed"
      : valor === CuantosObjetos
      ? "LimeGreen"
      : "Indigo";
  fill(color);

  if (color == "LimeGreen") {
    terminado = true;
  }

  text(`${label}: ${valor}`, x, y);
}

function updateHistory() {
  if (!terminado) {
    history.piedra.push(counts.piedra);
    history.papel.push(counts.papel);
    history.tijeras.push(counts.tijeras);
    history.lagarto.push(counts.lagarto);
    history.spock.push(counts.spock);
  }
}

function drawGraph() {
  let maxIterations = history.piedra.length;
  let graphHeight = 200;
  let graphWidth = width - 20;
  let xStep = graphWidth / maxIterations;

  strokeWeight(2);

  drawLineGraph(history.piedra, color(128, 128, 128, 90), xStep, graphHeight); // gray with transparency
  drawLineGraph(history.papel, color(255, 255, 0, 90), xStep, graphHeight); // yellow with transparency
  drawLineGraph(history.tijeras, color(255, 0, 0, 90), xStep, graphHeight); // red with transparency
  drawLineGraph(history.lagarto, color(0, 255, 0, 90), xStep, graphHeight); // green with transparency
  drawLineGraph(history.spock, color(238, 130, 238, 90), xStep, graphHeight); // violet with transparency
}

function drawLineGraph(data, col, xStep, graphHeight) {
  stroke(col);
  noFill();
  beginShape();
  for (let i = 0; i < data.length; i++) {
    let x = 10 + i * xStep;
    let y = height - 10 - map(data[i], 0, CuantosObjetos, 0, graphHeight);
    vertex(x, y);
  }
  endShape();
}
