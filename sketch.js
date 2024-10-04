let objetos = [];
let contadorPiedra = 0;
let contadorPapel = 0;
let contadorTijeras = 0;
let contadorLagarto = 0;
let contadorSpock = 0;
const CuantosObjetos = 150;
const tamanio = 15;

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

  displayCounters();
}

class Objeto {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.velX = random(-3, 3);
    this.velY = random(-3, 3);
    this.tipo = random(["piedra", "papel", "tijeras", "lagarto", "spock"]);
    //this.tipo = random(["piedra", "papel", "tijeras"]);
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
    // Intercambiar velocidades (rebote)
    [this.velX, otroObjeto.velX] = [otroObjeto.velX, this.velX];
    [this.velY, otroObjeto.velY] = [otroObjeto.velY, this.velY];

    // Asegurarse de que no se junten los objetos
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

  transformar(otroObjeto) {
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
  let valores = [
    contadorPiedra,
    contadorPapel,
    contadorTijeras,
    contadorLagarto,
    contadorSpock,
  ];
  let espaciado = width / (labels.length + 1);

  for (let i = 0; i < labels.length; i++) {
    mostrarContador(labels[i], valores[i], espaciado * (i + 1), height - 20);
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
          objeto1.transformar(objeto2);
          // Rebote tras colisión
          objeto1.bounceWith(objeto2);
        }
      }
    });
  });
}

function updateCounters() {
  contadorPiedra =
    contadorPapel =
    contadorTijeras =
    contadorLagarto =
    contadorSpock =
      0;

  for (let objeto of objetos) {
    if (objeto.tipo === "piedra") {
      contadorPiedra++;
    } else if (objeto.tipo === "papel") {
      contadorPapel++;
    } else if (objeto.tipo === "tijeras") {
      contadorTijeras++;
    } else if (objeto.tipo === "lagarto") {
      contadorLagarto++;
    } else if (objeto.tipo === "spock") {
      contadorSpock++;
    }
  }
}

function mostrarContador(label, valor, x, y) {
  // Dibujamos un cuadro semitransparente de fondo para el texto
  noStroke();
  fill("NavajoWhite");
  rectMode(CENTER);
  rect(x, y, 115, 20, 10);

  // Selección de color según el valor
  let color =
    valor === 0
      ? "OrangeRed"
      : valor === CuantosObjetos
      ? "LimeGreen"
      : "Indigo";
  fill(color);

  // Mostrar el texto
  text(`${label}: ${valor}`, x, y);
}
