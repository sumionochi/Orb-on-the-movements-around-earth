# Solar System Visualization Between **Heliocentric** and **Geocentric** : A Tribute to Orb On the movement around earth Anime & Mange

A React + TypeScript + Three.js project to visualize both **Heliocentric** (Sun-centered) and **Geocentric** (Earth-centered) models of the Solar System.  
In geocentric mode, each outer planet exhibits **retrograde** (epicyclic) motion and leaves behind a trail.  
Hover/click on orbit rings to display info about each planet in a side panel.  

<img width="1181" alt="image" src="https://github.com/user-attachments/assets/510fcec7-9c4a-48d3-942c-754d29f60d82" />

## Features

1. **Toggle Between Models**  
   - Switch between **Heliocentric** and **Geocentric** with a single button click.

2. **Retrograde Motion**  
   - In Geocentric mode, each outer planet (and the Sun itself) traces a retrograde loop (epicycle).  
   - A ring is drawn around each orbit, using a custom Three.js curve for retrograde paths.

3. **Planetary Info**  
   - Hover/click on an orbit ring to reveal custom info about the planet (distance from Sun/Earth, interesting facts, an Open Graph link to a relevant YouTube video).  
   - The info card includes a title, summary, and clickable thumbnail image.

4. **Camera Animation**  
   - The camera can start near the center and smoothly **zoom out** to the final vantage on load.  
   - Toggling between Geocentric and Heliocentric optionally re-triggers an animation that moves the camera to a new vantage point.

5. **Three.js & React Integration**  
   - Built on [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for rendering 3D in React.  
   - [drei](https://github.com/pmndrs/drei) for additional helpers like `<Stars />` and `<OrbitControls />`.

6. **Trails**  
   - In geocentric mode, each outer planet plus the Sun (except Earth/Moon) has a visible trail to highlight its path over time.

## Getting Started

### Prerequisites
- **Node.js** (v14+ recommended)  
- **npm** or **yarn** for dependency management

### Installation

1. **Clone this repo**:
   ```bash
   git clone https://github.com/your-username/solar-system-viz.git
   cd solar-system-viz
   ```
2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn
   ```

### Running Locally

To launch the development server (with hot reload):

```bash
npm run dev
# or
yarn dev
```

Then open http://localhost:3000 in your browser to see the scene.

### Building for Production

```bash
npm run build
# or
yarn build
```

Deploy the output from the `dist` or `build` folder (depending on your bundler).

## Project Structure

```
src/
  ┣ components/
  ┃   ┣ Planet.tsx
  ┃   ┣ OrbitRing.tsx
  ┃   ┣ CameraTransition.tsx (optional helper for camera animations)
  ┣ SolarSystem.tsx     // Main scene
  ┣ index.tsx           // App entry point
  ┗ App.css             // Global styling
public/
  ┣ index.html          // Basic HTML template
  ┗ ...
```

- **Planet.tsx**  
  Defines a Planet component that can revolve around a center, optionally leaving a `Trail` in geocentric mode.

- **OrbitRing.tsx**  
  Defines an OrbitRing component, drawing the planet’s orbit ring. In geocentric mode, uses a custom **RetrogradeCurve** to produce loops.

- **CameraTransition.tsx** (optional)  
  A small helper that interpolates the camera position from its current state to a target over time.  

- **SolarSystem.tsx**  
  The main container:
  - Sets up the `<Canvas>` from React Three Fiber.  
  - Adds lights, stars, orbit rings, planets, toggle button, and info card.

## How It Works

1. **Heliocentric vs. Geocentric**  
   - Controlled by a boolean `isHeliocentric`. Clicking a toggle button flips the state.  
   - In geocentric mode, Earth is at the center, and each outer planet + Sun uses an epicycle offset for retrograde.  

2. **Orbit Rings**  
   - Each ring is a `<TorusGeometry>` in heliocentric mode, or a `<TubeGeometry>` following a custom `RetrogradeCurve` in geocentric mode.

3. **Custom Info**  
   - Each planet (or ring) has a function `getHoverInfo() → InfoData` returning custom text, summary, and an Open Graph link.  
   - On click, the data populates an info card component displayed on the screen.

4. **Three.js + React**  
   - We rely on React Three Fiber to manage the scene, cameras, and updates in a React-friendly manner.  
   - [drei/Trail](https://github.com/pmndrs/drei#trail) adds a dynamic trail behind the planets in geocentric mode.

## Customization

- **Camera Positions**  
  If using the `CameraTransition` component, set your desired start/end vectors (for example, `[0,0,10]` → `[0,800,800]`).  

- **Epicycle Size & Speed**  
  In geocentric mode, the retrograde logic applies a small epicycle (5–10% radius) at 1.5–2× reverse speed. Tweak those parameters in the code to refine the loop shape.

- **Planet Speeds & Distances**  
  Adjust `orbitRadius`, `orbitSpeed`, and the distance info to reflect the scale you prefer (each planet is scaled down to keep them on-screen).

- **Trails**  
  The `<Trail>` component can be styled with different `width`, `length`, `decay`, and `color`.

- **Info Data**  
  Each planet has a dedicated block in `getHoverInfo()` for summary text and Open Graph links. Expand or revise the text as you like.

## Contributing

Feel free to submit a pull request or open an issue to discuss improvements, bug fixes, or new features. All contributions are welcome!

<img width="1201" alt="image" src="https://github.com/user-attachments/assets/8996c49e-0017-47b4-9162-9455d7d3728f" />

a wrong answer is not a meaningless one ~ Protagonist
