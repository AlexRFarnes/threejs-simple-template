import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";

/**
 * Base
 */
// Colors
const colors = {
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
// Define the resolution of the shadow; the higher the better, but also the more expensive and less performant

scene.add(sun);

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
  60,
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
seaGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

const seaMaterial = new THREE.MeshPhongMaterial({
  color: colors.blue,
  transparent: true,
  opacity: 0.6,
  shading: THREE.FlatShading,
});

const sea = new THREE.Mesh(seaGeometry, seaMaterial);
sea.receiveShadow = true;
sea.position.y = -600;
scene.add(sea);

// Cloud
function Cloud() {
  this.meshContainer = new THREE.Object3D();
  const geometry = new THREE.BoxGeometry(20, 20, 20);
  const material = new THREE.MeshPhongMaterial({
    color: colors.white,
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
    this.meshContainer.add(cloudPiece);
  }
}

// Sky
function Sky() {
  this.meshContainer = new THREE.Object3D();

  this.nClouds = 20;

  // To distribute the clouds consistently,
  // we need to place them according to a uniform angle
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
    cloud.meshContainer.position.y = Math.sin(a) * h;
    cloud.meshContainer.position.x = Math.cos(a) * h;

    cloud.meshContainer.rotation.z = a + Math.PI / 2;

    // for a better result, we position the clouds
    // at random depths inside of the scene
    cloud.meshContainer.position.z = -400 - Math.random() * 400;

    const scale = 1 + Math.random() * 2;
    cloud.meshContainer.scale.set(scale, scale, scale);

    this.meshContainer.add(cloud.meshContainer);
  }
}
const sky = new Sky();
sky.meshContainer.position.y = -600;
scene.add(sky.meshContainer);

// The Airplane
function Airplane() {
  this.meshContainer = new THREE.Object3D();

  // Cabin
  const geometryCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
  const materialCockpit = new THREE.MeshPhongMaterial({
    color: colors.red,
    shading: THREE.FlatShading,
  });
  const cockpit = new THREE.Mesh(geometryCockpit, materialCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.meshContainer.add(cockpit);
}

const airplane = new Airplane();
airplane.meshContainer.scale.set(0.25, 0.25, 0.25);
airplane.meshContainer.position.y = 100;
scene.add(airplane.meshContainer);

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

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update objects

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
