import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";
import { GUI } from "dat.gui";
import WebGL from "three/addons/capabilities/WebGL.js";

if (!WebGL.isWebGLAvailable()) {
  const warning = WebGL.getWebGLErrorMessage();
  const warningElement = document.getElementById("warning");
  warningElement.appendChild(warning);
  warningElement.classList.add("webgl-warning-visible");
}

let watch;
const container = document.querySelector(".canvas-container");
const canvas = document.querySelector(".webGL");
const loader = new GLTFLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  15,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

///// Load watch model
const loadingSpinner = document.getElementById("loading-spinner");

Promise.all([
  new Promise((resolve) => loader.load("/steampunk_watch.glb", resolve)),
])
  .then(([gltf1]) => {
    watch = gltf1.scene;

    watch.position.y = 0;
    watch.position.z = 1;

    watch.rotation.x = 1.5;

    // Positive for counter-clockwise, negative for counter-clockwise.
    // Upright.
    watch.rotation.y = 1.57;
    // At an angle.
    // watch.rotation.y = -0.8

    // Negative for downwards, positive for upwards.
    watch.rotation.z = 0.1;

    watch.scale.set(1.1, 1.1, 1.1);

    /// Enable watch to cast and receive shadows.
    watch.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(watch);

    loadingSpinner.style.display = "none";
    container.style.display = "block";

    const timeLine = gsap.timeline();

    timeLine.fromTo(
      ".stripe__one",
      {
        opacity: 0,
        y: -800,
      },
      {
        opacity: 1,
        y: 0,
        delay: 0.15,
        ease: "expo.inOut",
        duration: 0.5,
      }
    );

    timeLine.fromTo(
      ".stripe__two",
      {
        opacity: 0,
        y: 800,
      },
      {
        opacity: 1,
        y: 0,
        delay: 0.125,
        ease: "expo.inOut",
        duration: 0.5,
      }
    );

    timeLine.fromTo(
      ".stripe__three",
      {
        opacity: 0,
        y: -800,
      },
      {
        opacity: 1,
        y: 0,
        delay: 0.1,
        ease: "expo.inOut",
        duration: 0.5,
        onComplete: () => {
          document.getElementById("stripes").style.display = "block";
        },
      }
    );

    showOnCanvas();
  })
  .catch((error) => {
    console.error("Error loading model:", error);
  });

///// Instantiate lights
const DIRECTIONAL_LIGHT_INTENSITY = 3.5;
const AMBIENT_LIGHT_INTENSITY = 1;
const DEFAULT_SPOTLIGHT_INTENSITY = 40; // Will be overridden by the spotlightParams below.
const WHITE_LIGHTING = 0xffffff;
const BRASS_LIGHTING = 0xb8a373;

const ambientLight = new THREE.AmbientLight(
  BRASS_LIGHTING,
  AMBIENT_LIGHT_INTENSITY
);
const directionalLight = new THREE.DirectionalLight(
  BRASS_LIGHTING,
  DIRECTIONAL_LIGHT_INTENSITY
);
const rightSpotlight = new THREE.SpotLight(
  BRASS_LIGHTING,
  DEFAULT_SPOTLIGHT_INTENSITY
);
const leftSpotlight = new THREE.SpotLight(
  BRASS_LIGHTING,
  DEFAULT_SPOTLIGHT_INTENSITY
);
const rearSpotlight = new THREE.SpotLight(
  BRASS_LIGHTING,
  DEFAULT_SPOTLIGHT_INTENSITY
);

///// Light configurations
directionalLight.position.set(5.5, -20, 50); // X, Y, Z
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.002; // Fixes shadow artifacts.
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;

rightSpotlight.position.set(-5, 0, 0);
rightSpotlight.castShadow = true;
rightSpotlight.shadow.bias = -0.002; // Fixes shadow artifacts.
rightSpotlight.shadow.camera.near = 0.1;
rightSpotlight.shadow.camera.far = 25;
rightSpotlight.shadow.mapSize.width = 1024;
rightSpotlight.shadow.mapSize.height = 1024;

leftSpotlight.position.set(5, 0, 0);
leftSpotlight.castShadow = true;
leftSpotlight.shadow.bias = -0.002; // Fixes shadow artifacts.
leftSpotlight.shadow.camera.near = 5;
leftSpotlight.shadow.camera.far = 25;
leftSpotlight.shadow.mapSize.width = 1024;
leftSpotlight.shadow.mapSize.height = 1024;

rearSpotlight.position.set(0, 0, -5);
rearSpotlight.castShadow = true;
rearSpotlight.shadow.bias = -0.002; // Fixes shadow artifacts.
rearSpotlight.shadow.mapSize.width = 1024;
rearSpotlight.shadow.mapSize.height = 1024;
rearSpotlight.shadow.camera.near = 0.5;
rearSpotlight.shadow.camera.far = 500;

///// Add lights to scene
scene.add(ambientLight);
scene.add(directionalLight);
scene.add(leftSpotlight);
scene.add(rightSpotlight);
scene.add(rearSpotlight);

///// Responsiveness
window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  let scaleFactor = Math.min(width, height) / 900;

  const minScale = 1;
  const maxScale = 1.5; 
  scaleFactor = Math.max(minScale, Math.min(maxScale, scaleFactor));

  watch.scale.set(scaleFactor, scaleFactor, scaleFactor);
});

const WHITE = "#FFFFFF";
const BRASS = "#B8A373";

const spotlightParams = {
  rightSpotlightColor: BRASS,
  rightSpotlightIntensity: 20,
  rightSpotlightAngle: 1,
  rightSpotlightPenumbra: 0.65,
  rightSpotlightDistance: 10,

  leftSpotlightColor: BRASS,
  leftSpotlightIntensity: 20,
  leftSpotlightAngle: 1,
  leftSpotlightPenumbra: 0.65,
  leftSpotlightDistance: 10,

  rearSpotlightColor: BRASS,
  rearSpotlightIntensity: 30,
  rearSpotlightAngle: 1,
  rearSpotlightPenumbra: 0.65,
  rearSpotlightDistance: 10,
};

///// DevTools Area
const lightParameters = {
  lightIntensity: DIRECTIONAL_LIGHT_INTENSITY,
  lightX: directionalLight.position.x,
  lightY: directionalLight.position.y,
  lightZ: directionalLight.position.z,
};

function updateDirectionalLight() {
  directionalLight.intensity = lightParameters.lightIntensity;
  directionalLight.position.set(
    lightParameters.lightX,
    lightParameters.lightY,
    lightParameters.lightZ
  );
}

/// Enable DEV gui
// const gui = new GUI();
// const lightFolder = gui.addFolder("Directional Light");
// lightFolder
//   .add(lightParameters, "lightIntensity", 0, 10)
//   .onChange(updateDirectionalLight);
// lightFolder
//   .add(lightParameters, "lightX", -50, 50)
//   .onChange(updateDirectionalLight);
// lightFolder
//   .add(lightParameters, "lightY", -50, 50)
//   .onChange(updateDirectionalLight);
// lightFolder
//   .add(lightParameters, "lightZ", -50, 50)
//   .onChange(updateDirectionalLight);

// const rightSpotlightFolder = gui.addFolder("Right Spotlight");
// rightSpotlightFolder
//   .addColor(spotlightParams, "rightSpotlightColor")
//   .onChange(() => {
//     rightSpotlight.color.set(spotlightParams.rightSpotlightColor);
//   });
// rightSpotlightFolder
//   .add(spotlightParams, "rightSpotlightIntensity", 0, 50)
//   .onChange(() => {
//     rightSpotlight.intensity = spotlightParams.rightSpotlightIntensity;
//   });
// rightSpotlightFolder
//   .add(spotlightParams, "rightSpotlightAngle", 0, Math.PI)
//   .onChange(() => {
//     rightSpotlight.angle = spotlightParams.rightSpotlightAngle;
//   });
// rightSpotlightFolder
//   .add(spotlightParams, "rightSpotlightPenumbra", 0, 2)
//   .onChange(() => {
//     rightSpotlight.penumbra = spotlightParams.rightSpotlightPenumbra;
//   });
// rightSpotlightFolder
//   .add(spotlightParams, "rightSpotlightDistance", 1, 50)
//   .onChange(() => {
//     rightSpotlight.distance = spotlightParams.rightSpotlightDistance;
//   });

// const leftSpotlightFolder = gui.addFolder("Left Spotlight");
// leftSpotlightFolder
//   .addColor(spotlightParams, "leftSpotlightColor")
//   .onChange(() => {
//     leftSpotlight.color.set(spotlightParams.leftSpotlightColor);
//   });
// leftSpotlightFolder
//   .add(spotlightParams, "leftSpotlightIntensity", 0, 50)
//   .onChange(() => {
//     leftSpotlight.intensity = spotlightParams.leftSpotlightIntensity;
//   });
// leftSpotlightFolder
//   .add(spotlightParams, "leftSpotlightAngle", 0, Math.PI)
//   .onChange(() => {
//     leftSpotlight.angle = spotlightParams.leftSpotlightAngle;
//   });
// leftSpotlightFolder
//   .add(spotlightParams, "leftSpotlightPenumbra", 0, 2)
//   .onChange(() => {
//     leftSpotlight.penumbra = spotlightParams.leftSpotlightPenumbra;
//   });
// leftSpotlightFolder
//   .add(spotlightParams, "leftSpotlightDistance", 1, 50)
//   .onChange(() => {
//     leftSpotlight.distance = spotlightParams.leftSpotlightDistance;
//   });

// const rearSpotlightFolder = gui.addFolder("Rear Spotlight");
// rearSpotlightFolder
//   .addColor(spotlightParams, "rearSpotlightColor")
//   .onChange(() => {
//     rearSpotlight.color.set(spotlightParams.rearSpotlightColor);
//   });
// rearSpotlightFolder
//   .add(spotlightParams, "rearSpotlightIntensity", 0, 50)
//   .onChange(() => {
//     rearSpotlight.intensity = spotlightParams.rearSpotlightIntensity;
//   });
// rearSpotlightFolder
//   .add(spotlightParams, "rearSpotlightAngle", 0, Math.PI)
//   .onChange(() => {
//     rearSpotlight.angle = spotlightParams.rearSpotlightAngle;
//   });
// rearSpotlightFolder
//   .add(spotlightParams, "rearSpotlightPenumbra", 0, 2)
//   .onChange(() => {
//     rearSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;
//   });
// rearSpotlightFolder
//   .add(spotlightParams, "rearSpotlightDistance", 1, 50)
//   .onChange(() => {
//     rearSpotlight.distance = spotlightParams.rearSpotlightDistance;
//   });

///// Apply lighting settings
rightSpotlight.color.set(spotlightParams.rightSpotlight);
rightSpotlight.intensity = spotlightParams.rightSpotlightIntensity;
rightSpotlight.angle = spotlightParams.rightSpotlightAngle;
rightSpotlight.penumbra = spotlightParams.rightSpotlightPenumbra;
rightSpotlight.distance = spotlightParams.rightSpotlightDistance;

leftSpotlight.color.set(spotlightParams.leftSpotlightColor);
leftSpotlight.intensity = spotlightParams.leftSpotlightIntensity;
leftSpotlight.angle = spotlightParams.leftSpotlightAngle;
leftSpotlight.penumbra = spotlightParams.leftSpotlightPenumbra;
leftSpotlight.distance = spotlightParams.leftSpotlightDistance;

rearSpotlight.color.set(spotlightParams.rearSpotlightColor);
rearSpotlight.intensity = spotlightParams.rearSpotlightIntensity;
rearSpotlight.angle = spotlightParams.rearSpotlightAngle;
rearSpotlight.penumbra = spotlightParams.rearSpotlightPenumbra;
rearSpotlight.distance = spotlightParams.rearSpotlightDistance;

///// Main Stuff
const controls = new OrbitControls(camera, container);
controls.enableDamping = true;
controls.autoRotate = false;
controls.autoRotateSpeed = 1;
controls.enablePan = false;
controls.maxDistance = 20;
controls.minDistance = 20;
camera.position.z = 20;

function showOnCanvas() {
  controls.update();
  updateDirectionalLight();

  renderer.render(scene, camera);
  requestAnimationFrame(showOnCanvas);
}

showOnCanvas();
