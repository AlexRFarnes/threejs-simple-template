import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { Color } from "three";

/**
 * Mouse move
 */
document.addEventListener("mousemove", handleMouseMove);

const mousePos = {
  x: 0,
  y: 0,
};

function handleMouseMove(e) {
  // here we are converting the mouse position value received
  // to a normalized value varying between -1 and 1;
  mousePos.x = (e.clientX / sizes.width) * 2 - 1;
  mousePos.y = 1 - (e.clientY / sizes.height) * 2; // Inverse the formula for the vertical axis (turn up to positive)
}

/**
 * Base
 */
// Colors
const Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
};
//GUI
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
// Add a fog effect to the scene; same color as the
// background color used in the style sheet
scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

/**
 * Lights
 */
// Hemisphere light
// A hemisphere light is a gradient colored light;
// the first parameter is the sky color, the second parameter is the ground color,
// the third parameter is the intensity of the light
const hemisphereLight = new THREE.HemisphereLightProbe(0xaaaaaa, 0x000000, 0.9);
scene.add(hemisphereLight);

// Directional light
// A directional light shines from a specific direction.
// It acts like the sun, that means that all the rays produced are parallel.
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
// Set the direction of the light
sun.position.set(150, 350, 350);
// Allow shadow casting
sun.castShadow = true;
// Define the visible area of the projected shadow
sun.shadow.camera.left = -400;
sun.shadow.camera.right = 400;
sun.shadow.camera.top = 400;
sun.shadow.camera.bottom = -400;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 1000;

// define the resolution of the shadow; the higher the better,
// but also the more expensive and less performant
sun.shadow.mapSize.set(2048, 2048);

const sunLightcameraHelper = new THREE.CameraHelper(sun.shadow.camera);
sunLightcameraHelper.visible = false;
scene.add(sunLightcameraHelper);
// Define the resolution of the shadow; the higher the better, but also the more expensive and less performant

scene.add(sun);

// an ambient light modifies the global color of a scene and makes the shadows softer
const ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
scene.add(ambientLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  1,
  10000
);
camera.position.x = 0;
camera.position.y = 100;
camera.position.z = 200;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Objects
 */
// Sea
const seaGeometry = new THREE.CylinderGeometry(600, 600, 800, 40, 10); // radius top, radius bottom, height, number of segments on the radius, number of segments vertically

// rotate the geometry on the x axis
// seaGeometry.rotateX(-Math.PI * 0.5);
seaGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

const seaMaterial = new THREE.MeshPhongMaterial({
  color: Colors.blue,
  transparent: true,
  opacity: 0.6,
  flatShading: true,
});

const sea = new THREE.Mesh(seaGeometry, seaMaterial);
sea.receiveShadow = true;
sea.position.y = -600;
scene.add(sea);

// Cloud
function Cloud() {
  this.mesh = new THREE.Object3D();
  const geometry = new THREE.BoxGeometry(20, 20, 20);
  const material = new THREE.MeshPhongMaterial({
    color: Colors.white,
  });

  // duplicate the geometry a random number of times
  const nBlocks = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < nBlocks; i++) {
    const cloudPiece = new THREE.Mesh(geometry, material);
    // set the position and the rotation of each cube randomly
    cloudPiece.position.x = i * 15;
    cloudPiece.position.y = Math.random() * 10;
    cloudPiece.position.z = Math.random() * 10;
    cloudPiece.rotation.z = Math.random() * Math.PI * 2;
    cloudPiece.rotation.y = Math.random() * Math.PI * 2;

    const scale = 0.1 + Math.random() * 0.9;
    cloudPiece.scale.set(scale, scale, scale);

    // allow each cube to cast and to receive shadows
    cloudPiece.castShadow = true;
    cloudPiece.receiveShadow = true;
    this.mesh.add(cloudPiece);
  }
}

// Sky
function Sky() {
  this.mesh = new THREE.Object3D();

  this.nClouds = 20;

  // To distribute the clouds consistently,
  // we need to place them according to a uniform angle
  // Math.PI * 2 = 360deg
  const stepAngle = (Math.PI * 2) / this.nClouds;

  for (let i = 0; i < this.nClouds; i++) {
    const cloud = new Cloud();

    // set the rotation and the position of each cloud;
    // for that we use a bit of trigonometry
    const a = stepAngle * i; // this is the final angle of the cloud
    const h = 750 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

    // Trigonometry!!! I hope you remember what you've learned in Math :)
    // in case you don't:
    // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
    cloud.mesh.position.y = Math.sin(a) * h;
    cloud.mesh.position.x = Math.cos(a) * h;

    cloud.mesh.rotation.z = a + Math.PI / 2;

    // for a better result, we position the clouds
    // at random depths inside of the scene
    cloud.mesh.position.z = -400 - Math.random() * 400;

    const scale = 1 + Math.random() * 2;
    cloud.mesh.scale.set(scale, scale, scale);

    this.mesh.add(cloud.mesh);
  }
}
const sky = new Sky();
sky.mesh.position.y = -600;
scene.add(sky.mesh);

// The Airplane
function Airplane() {
  this.mesh = new THREE.Object3D();

  // Cabin
  const geometryCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
  const materialCockpit = new THREE.MeshPhongMaterial({
    // wireframe: true,
    color: Colors.red,
    flatShading: true,
  });
  const cockpit = new THREE.Mesh(geometryCockpit, materialCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  geometryCockpit.attributes.position.needsUpdate = true;
  this.mesh.add(cockpit);

  // Engine
  const geometryEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  const materialEngine = new THREE.MeshPhongMaterial({
    color: Color.white,
    flatShading: true,
  });
  const engine = new THREE.Mesh(geometryEngine, materialEngine);
  engine.position.x = 40;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // Tail
  const geometryTail = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  const materialTail = new THREE.MeshPhongMaterial({
    color: Color.red,
    flatShading: true,
  });
  const tailPlane = new THREE.Mesh(geometryTail, materialTail);
  tailPlane.position.set(-35, 25, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // Wing
  const geometryWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  const materialWing = new THREE.MeshPhongMaterial({
    color: Color.red,
    flatShading: true,
  });
  const sideWing = new THREE.Mesh(geometryWing, materialWing);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  // Propeller
  const geometryPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  const materialPropeller = new THREE.MeshPhongMaterial({
    color: Color.brownDark,
    flatShading: true,
  });
  this.propeller = new THREE.Mesh(geometryPropeller, materialPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;
  this.propeller.position.set(50, 0, 0);
  this.mesh.add(this.propeller);

  // Blades
  const geometryBlades = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
  const materialBlades = new THREE.MeshPhongMaterial({
    color: Color.brownDark,
    flatShading: true,
  });
  const blade = new THREE.Mesh(geometryBlades, materialBlades);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
}

const airplane = new Airplane();
airplane.mesh.scale.set(0.25, 0.25, 0.25);
airplane.mesh.position.y = 100;
scene.add(airplane.mesh);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Update plane function
function updatePlane(elapsedTime) {
  // let's move the airplane between -100 and 100 on the horizontal axis,
  // and between 25 and 175 on the vertical axis,
  // depending on the mouse position which ranges between -1 and 1 on both axes;
  const targetX = normalize(mousePos.x, -0.75, 0.75, -100, 100);
  const targetY = normalize(mousePos.y, -0.75, 0.75, 25, 130);

  // Move the plane at each frame by adding a fraction of the remaining distance
  airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;
  // airplane.mesh.position.x = targetX;

  // Rotate the plane proportionally to the remaining distance
  airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
  airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;

  airplane.propeller.rotation.x = elapsedTime * 50;
}

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update objects
  updatePlane(elapsedTime);
  sea.rotation.z += 0.005;
  sky.mesh.rotation.z += 0.01;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

function normalize(value, vmin, vmax, tmin, tmax) {
  const nv = Math.max(Math.min(value, vmax), vmin);
  const dv = vmax - vmin;
  const pc = (nv - vmin) / dv;
  const dt = tmax - tmin;
  const tv = tmin + pc * dt;
  return tv;
}
