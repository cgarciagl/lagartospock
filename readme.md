# Proyecto Piedra, Papel, Tijeras, Lagarto, Spock

Este proyecto es una implementación del juego "Piedra, Papel, Tijeras, Lagarto, Spock" utilizando la biblioteca p5.js. El juego extiende las reglas clásicas de "Piedra, Papel, Tijeras" añadiendo dos elementos adicionales: Lagarto y Spock.

## Estructura del Proyecto

- **index.html**: El archivo HTML principal que carga el sketch de p5.js.
- **p5.js**: La biblioteca p5.js utilizada para la visualización y animación.
- **p5.sound.min.js**: La biblioteca p5.sound para añadir efectos de sonido.
- **sketch.js**: El archivo JavaScript principal que contiene la lógica del juego y las reglas.
- **style.css**: El archivo CSS para los estilos de la página.

## Reglas del Juego

Las reglas del juego están definidas en el archivo [sketch.js](sketch.js) de la siguiente manera:

- **Piedra**:
  - Gana contra: Tijeras, Lagarto
  - Pierde contra: Papel, Spock
- **Papel**:
  - Gana contra: Piedra, Spock
  - Pierde contra: Tijeras, Lagarto
- **Tijeras**:
  - Gana contra: Papel, Lagarto
  - Pierde contra: Piedra, Spock
- **Lagarto**:
  - Gana contra: Papel, Spock
  - Pierde contra: Piedra, Tijeras
- **Spock**:
  - Gana contra: Piedra, Tijeras
  - Pierde contra: Papel, Lagarto

## Cómo Ejecutar el Proyecto

1. Clona el repositorio o descarga los archivos.
2. Abre el archivo `index.html` en tu navegador web.
3. Disfruta del juego y observa cómo interactúan los diferentes elementos.

## Créditos

Este proyecto utiliza la biblioteca [p5.js](https://p5js.org/) para la visualización y animación, y [p5.sound](https://p5js.org/reference/#/libraries/p5.sound) para los efectos de sonido.
