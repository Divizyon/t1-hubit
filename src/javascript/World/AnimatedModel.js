import * as THREE from "three";

/**
 * Handles animated model loading, material assignment, and animation
 */
export default class AnimatedModel {
  constructor(_options) {
    // Options
    this.time = _options.time;
    this.resources = _options.resources;
    this.materials = _options.materials;
    this.shadows = _options.shadows;
    this.debug = _options.debug;
    this.modelName = _options.modelName;
    this.position = _options.position || new THREE.Vector3(0, 0, 0);
    this.rotation = _options.rotation || new THREE.Euler(0, 0, 0);
    this.scale = _options.scale || new THREE.Vector3(1, 1, 1);

    // Set up container
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;

    // Initialize
    this.init();
  }

  /**
   * Initialize the animated model
   */
  init() {
    // Load the model resource
    if (!this.resources.items[this.modelName]) {
      console.warn(`Model ${this.modelName} not found in resources`);
      return;
    }

    // Clone the model
    const gltf = this.resources.items[this.modelName];
    const modelScene = gltf.scene.clone();

    // Log model structure to help with debugging
    console.log(`Model ${this.modelName} structure:`);
    this.logModelStructure(modelScene);

    // Process and prepare the model
    this.model = this.prepareModel(modelScene);

    // Add model to container
    this.container.add(this.model);

    // Update container position, rotation, and scale
    this.container.position.copy(this.position);
    this.container.rotation.copy(this.rotation);
    this.container.scale.copy(this.scale);
    this.container.updateMatrix();

    // Setup animations
    this.setupAnimations(gltf.animations);

    // Add debug features if enabled
    if (this.debug) {
      this.setupDebug();
    }
  }

  /**
   * Log the model's structure to the console
   */
  logModelStructure(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        console.log(
          `Mesh: ${child.name}, Material: ${
            child.material ? child.material.type : "none"
          }`
        );
      } else if (child.isObject3D) {
        console.log(
          `Object3D: ${child.name}, Children: ${child.children.length}`
        );
      }
    });
  }

  /**
   * Prepare the model by applying materials and shadows
   */
  prepareModel(model) {
    // Create a reference to materials for easier access
    const materials = this.materials.shades.items;

    // Create a fallback materials map in case project materials aren't available
    const matcapMaterials = {
      beige:
        materials.beige || new THREE.MeshMatcapMaterial({ color: 0xe3caa5 }),
      white:
        materials.white || new THREE.MeshMatcapMaterial({ color: 0xffffff }),
      blue: materials.blue || new THREE.MeshMatcapMaterial({ color: 0x3498db }),
      green:
        materials.green || new THREE.MeshMatcapMaterial({ color: 0x2ecc71 }),
      brown:
        materials.brown || new THREE.MeshMatcapMaterial({ color: 0x8b4513 }),
      red: materials.red || new THREE.MeshMatcapMaterial({ color: 0xe74c3c }),
      black:
        materials.black || new THREE.MeshMatcapMaterial({ color: 0x000000 }),
      gray: materials.gray || new THREE.MeshMatcapMaterial({ color: 0x95a5a6 }),
      yellow:
        materials.yellow || new THREE.MeshMatcapMaterial({ color: 0xf1c40f }),
      orange:
        materials.orange || new THREE.MeshMatcapMaterial({ color: 0xe67e22 }),
      purple:
        materials.purple || new THREE.MeshMatcapMaterial({ color: 0x9b59b6 }),
      metal:
        materials.metal || new THREE.MeshMatcapMaterial({ color: 0xbdc3c7 }),
    };

    // Apply materials to meshes based on their names or position in hierarchy
    model.traverse((child) => {
      if (child.isMesh) {
        // Try to match mesh names with materials
        this.applyMaterialToMesh(child, matcapMaterials);

        // Add shadows
        if (this.shadows) {
          this.shadows.add(child);
        }
      }
    });

    return model;
  }

  /**
   * Apply appropriate material to a mesh based on its name
   */
  applyMaterialToMesh(mesh, materials) {
    const name = mesh.name.toLowerCase();

    // Try to match with project's naming convention first (shadeColor or matcapColor)
    const shadeMatch = mesh.name.match(/^shade([a-z]+)_?[0-9]{0,3}?/i);
    const matcapMatch = mesh.name.match(/^matcap([a-z]+)_?[0-9]{0,3}?/i);

    if (shadeMatch) {
      const materialName = `${shadeMatch[1]
        .substring(0, 1)
        .toLowerCase()}${shadeMatch[1].substring(1)}`;
      if (this.materials.shades.items[materialName]) {
        mesh.material = this.materials.shades.items[materialName];
        return;
      }
    }

    if (matcapMatch) {
      const materialName = matcapMatch[1].toLowerCase();
      if (this.materials.items[materialName]) {
        mesh.material = this.materials.items[materialName];
        return;
      }
    }

    // If no match with naming convention, try common name patterns
    if (
      name.includes("water") ||
      name.includes("sea") ||
      name.includes("ocean")
    ) {
      mesh.material = materials.blue;
    } else if (
      name.includes("wood") ||
      name.includes("dock") ||
      name.includes("timber")
    ) {
      mesh.material = materials.brown;
    } else if (
      name.includes("bird") ||
      name.includes("seagull") ||
      name.includes("gull")
    ) {
      mesh.material = materials.white;
    } else if (name.includes("beak") || name.includes("bill")) {
      mesh.material = materials.orange;
    } else if (name.includes("eye")) {
      mesh.material = materials.black;
    } else if (
      name.includes("leaf") ||
      name.includes("grass") ||
      name.includes("plant")
    ) {
      mesh.material = materials.green;
    } else if (name.includes("sand") || name.includes("beach")) {
      mesh.material = materials.beige;
    } else if (name.includes("roof") || name.includes("tile")) {
      mesh.material = materials.red;
    } else if (
      name.includes("metal") ||
      name.includes("steel") ||
      name.includes("iron")
    ) {
      mesh.material = materials.metal;
    } else {
      // Default assignment for meshes that don't match known patterns
      const meshIndex = mesh.id % Object.keys(materials).length;
      const colorKeys = Object.keys(materials);
      mesh.material = materials[colorKeys[meshIndex]];
    }

    // Ensure material is properly set up
    mesh.material.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  /**
   * Setup animations for the model
   */
  setupAnimations(animations) {
    this.animations = {};
    this.animations.mixer = new THREE.AnimationMixer(this.model);
    this.animations.clips = animations;
    this.animations.actions = {};

    if (this.animations.clips.length > 0) {
      // Create an action for each animation clip
      for (const clip of this.animations.clips) {
        console.log(`Creating action for animation: ${clip.name}`);
        this.animations.actions[clip.name] =
          this.animations.mixer.clipAction(clip);
      }

      // Play the first animation by default
      const firstAnimationName = this.animations.clips[0].name;
      this.animations.actions.current =
        this.animations.actions[firstAnimationName];
      this.animations.actions.current.play();
      console.log(`Started playing animation: ${firstAnimationName}`);

      // Setup animation update on each frame
      this.time.on("tick", () => {
        if (this.animations.mixer) {
          this.animations.mixer.update(this.time.delta * 0.001);
        }
      });
    } else {
      console.warn(`No animations found for model ${this.modelName}`);
    }
  }

  /**
   * Play a specific animation by name
   */
  playAnimation(name) {
    if (!this.animations.actions[name]) {
      console.warn(`Animation ${name} not found`);
      return;
    }

    const newAction = this.animations.actions[name];
    const oldAction = this.animations.actions.current;

    if (newAction === oldAction) return;

    newAction.reset();
    newAction.play();
    newAction.crossFadeFrom(oldAction, 0.5);

    this.animations.actions.current = newAction;
  }

  /**
   * Setup debug controls
   */
  setupDebug() {
    const debugFolder = this.debug.addFolder(
      `Animated Model: ${this.modelName}`
    );

    // Position controls
    debugFolder
      .add(this.container.position, "x", -50, 50)
      .name("Position X")
      .onChange(() => this.container.updateMatrix());
    debugFolder
      .add(this.container.position, "y", -50, 50)
      .name("Position Y")
      .onChange(() => this.container.updateMatrix());
    debugFolder
      .add(this.container.position, "z", -10, 10)
      .name("Position Z")
      .onChange(() => this.container.updateMatrix());

    // Rotation controls
    debugFolder
      .add(this.container.rotation, "x", -Math.PI, Math.PI)
      .name("Rotation X")
      .onChange(() => this.container.updateMatrix());
    debugFolder
      .add(this.container.rotation, "y", -Math.PI, Math.PI)
      .name("Rotation Y")
      .onChange(() => this.container.updateMatrix());
    debugFolder
      .add(this.container.rotation, "z", -Math.PI, Math.PI)
      .name("Rotation Z")
      .onChange(() => this.container.updateMatrix());

    // Scale controls
    const scaleControl = debugFolder
      .add(this.container.scale, "x", 0.1, 50)
      .name("Scale");
    scaleControl.onChange(() => {
      this.container.scale.y = this.container.scale.x;
      this.container.scale.z = this.container.scale.x;
      this.container.updateMatrix();
    });

    // Animation controls
    if (this.animations.clips && this.animations.clips.length > 0) {
      const animationParameters = {};

      // Add play button for each animation
      for (const clip of this.animations.clips) {
        animationParameters[`play_${clip.name}`] = () => {
          this.playAnimation(clip.name);
        };

        debugFolder.add(animationParameters, `play_${clip.name}`);
      }
    }
  }
}
