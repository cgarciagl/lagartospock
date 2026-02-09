# 🦎 RPSLS Evolution: Simulation

Una simulación visual dinámica de supervivencia basada en las reglas extendidas de **Piedra, Papel, Tijeras, Lagarto, Spock**. Este proyecto utiliza algoritmos de detección de colisiones optimizados y una interfaz moderna para observar la evolución de diferentes facciones en competencia.

![Versión](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Tecnologías](https://img.shields.io/badge/tech-p5.js%20|%20JS%20|%20CSS3-orange.svg)

## 🎮 Características principales

- **Simulación en Tiempo Real**: Observa a 100 entidades interactuar y transformarse según las reglas del juego.
- **Dos Modalidades**:
  - **Clásico (RPS)**: El sistema tradicional de 3 elementos.
  - **Extendido (RPSLS)**: La famosa variante popularizada por *The Big Bang Theory*.
- **Dashboard de Estadísticas**: Seguimiento en vivo del conteo de cada facción y barras de predominancia.
- **Gráfico Histórico**: Visualización de la evolución poblacional a lo largo del tiempo integrada en el canvas.
- **Rendimiento Optimizado**: Implementación de **QuadTree** para la gestión de colisiones, permitiendo una ejecución fluida incluso con un alto número de entidades.
- **Diseño Premium**: Interfaz moderna con modo oscuro, tipografía *Inter/Outfit* y efectos de *Glassmorphism*.

## 📐 Reglas de RPSLS

El sistema de reglas para la modalidad extendida es el siguiente:
- **Tijeras** corta a **Papel**
- **Papel** tapa a **Piedra**
- **Piedra** aplasta a **Lagarto**
- **Lagarto** envenena a **Spock**
- **Spock** rompe a **Tijeras**
- **Tijeras** decapita a **Lagarto**
- **Lagarto** devora a **Papel**
- **Papel** desautoriza a **Spock**
- **Spock** vaporiza a **Piedra**
- (Y como siempre, **Piedra** aplasta a **Tijeras**)

## 🚀 Instalación y Uso

No requiere compilación ni dependencias complejas. Basta con clonar el repositorio y abrir el archivo `index.html` en cualquier navegador moderno.

```bash
git clone https://github.com/tu-usuario/lagartospock.git
cd lagartospock
# Abrir index.html en tu navegador
```

## 🛠️ Tecnologías utilizadas

- **[p5.js](https://p5js.org/)**: Motor principal para el renderizado del canvas y la lógica física.
- **[QuadTree](https://github.com/CodingTrain/QuadTree)**: Para la optimización de la detección de colisiones espaciales.
- **Vanilla JavaScript (ES6+)**: Lógica de simulación y gestión del estado.
- **CSS3 Moderno**: Diseño centrado en variables CSS y flexbox/grid.

## 🤝 Créditos

Inspirado en los retos de programación de **The Coding Train** y la cultura geek de **The Big Bang Theory**.

---
Desarrollado con ❤️ para simulaciones dinámicas.
