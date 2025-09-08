import "./style.css";

import { MeshBuilder, MeshPredicate } from "@babylonjs/core";


import {
  Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight,
  VertexData, Mesh, ShaderMaterial, Color3, VertexBuffer,
  PointerEventTypes
} from "@babylonjs/core";
import "@babylonjs/core/Helpers/sceneHelpers"; // (for createOrUpdateSelectionOctree typings)

// If your Emscripten build was `-sMODULARIZE -sEXPORT_NAME=SphereWasm`
import Scultor from "./Scultor.js";

const V_CAP = 200_000;          // vertices capacity
const I_CAP = 400_000;          // indices capacity (≈ 2× tris)
const RADIUS = 5;
const W = 256, H = 256;

type WasmModule = {
  HEAPF32: Float32Array; HEAPU32: Uint32Array;
  _malloc(n: number): number; _free(p: number): void;
  // deform: (posPtr: number, vertCount: number, hit: number[] | Float32Array, radius: number, push: number) => void;
  // computeNormals: (posPtr: number, normPtr: number, idxPtr: number,
  //   vcapA: number, vcapB: number, icap: number, stride: number) => void;
};



const main = () => {
  const renderCanvas =
    document.querySelector<HTMLCanvasElement>("#renderCanvas");
  if (!renderCanvas) {
    return;
  }

  const overlay = document.createElement("pre");
  overlay.id = "perfOverlay";
  overlay.style.cssText = "position:fixed;left:8px;top:8px;margin:0;padding:4px 8px;background:#0008;color:#fff;font:12px/1.3 monospace;z-index:10";
  document.body.appendChild(overlay);

  const engine = new Engine(renderCanvas);
  const scene = new Scene(engine);

  
  scene.createDefaultCameraOrLight(true, true, true);
  scene.createDefaultEnvironment();
  scene.createOrUpdateSelectionOctree(64, 2); // maxCapacity, maxDepth

  // const box = MeshBuilder.CreateBox("box", { size: 0.5 });
  // box.position = new Vector3(0, 0.25, 0);

  // Camera & light
  const camera = new ArcRotateCamera("cam", Math.PI * 0.25, Math.PI * 0.33, 15, Vector3.Zero(), scene);
  camera.attachControl(renderCanvas, true);
  new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);

  (async () => {
    const Module = (await (Scultor as any)({})) as WasmModule;

    // Allocate WASM memory
    const posPtr = Module._malloc(V_CAP * 3 * 4);
    const normPtr = Module._malloc(V_CAP * 3 * 4);
    const idxPtr = Module._malloc(I_CAP * 4);

    // Typed views over the WASM heap
    const posF32 = new Float32Array(Module.HEAPF32.buffer, posPtr, V_CAP * 3);
    const normF32 = new Float32Array(Module.HEAPF32.buffer, normPtr, V_CAP * 3);
    const idxU32 = new Uint32Array(Module.HEAPU32.buffer, idxPtr, I_CAP);

    // ---- Build initial sphere data (JS) ----
    const positions = createSpherePositions(RADIUS, W, H);
    const indices = createSphereIndices(W, H);
    const vertCount = positions.length / 3;
    const indexCount = indices.length;

    posF32.set(positions);
    idxU32.set(indices);

    // Compute initial normals in WASM
    //Module.computeNormals(posPtr, normPtr, idxPtr, V_CAP, V_CAP, I_CAP, 3);

    // ---- Mesh + GPU buffers (all updatable) ----
    let mesh = new Mesh("sphere", scene);

    //const mesh = MeshBuilder.CreateSphere("sphere", { segments: 12, diameter: 1 }, scene);

    const vdat = new VertexData();
    vdat.positions = posF32.subarray(0, vertCount * 3); // clip to used region
    vdat.normals = normF32.subarray(0, vertCount * 3);
    vdat.indices = idxU32.subarray(0, indexCount);
    vdat.applyToMesh(mesh, true); // 'true' => updatable buffers

    // Simple custom lighting via ShaderMaterial (like your Three ShaderMaterial)

    // ---- Picking + sculpting ----
    let isPointerDown = false;
    const INFLUENCE_RADIUS = 0.05; // world units
    const PUSH_DISTANCE = 0.01;

    // Only pick this mesh (perf)
    //let pickPredicate : MeshPredicate = (m: Mesh) => m === mesh;

    scene.onPointerObservable.add((pi) => {
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        isPointerDown = true;
        sculptAtPointer();
      } else if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (isPointerDown) sculptAtPointer();
      } else if (pi.type === PointerEventTypes.POINTERUP) {
        isPointerDown = false;
        // optional: any finalization here
      }
    });

    function sculptAtPointer() {
      const pick = scene.pick(scene.pointerX, scene.pointerY); //predicate
      if (!pick?.hit || !pick.pickedPoint) return;  

      const p = pick.pickedPoint!;
      // Call your WASM kernel (expects xyz triple)
      // Module.deform(posPtr, vertCount, [p.x, p.y, p.z], INFLUENCE_RADIUS, PUSH_DISTANCE);

      // // Recompute normals in WASM
      // Module.computeNormals(posPtr, normPtr, idxPtr, V_CAP, V_CAP, I_CAP, 3);

      // Push updated data to GPU buffers (no reallocation)
      mesh.updateVerticesData(VertexBuffer.PositionKind, posF32.subarray(0, vertCount * 3), /*updateExtends*/ true);
      mesh.updateVerticesData(VertexBuffer.NormalKind, normF32.subarray(0, vertCount * 3), /*updateExtends*/ false);

      // Keep picking precise after shape changes
      mesh.refreshBoundingInfo(true);
    }

    // ---- Render loop / FPS overlay ----
    // engine.runRenderLoop(() => {
    //   //shader.setVector3("cameraPosition", camera.position);

    //   // Simple perf overlay
    
    // });

    window.addEventListener("resize", () => engine.resize());
  })();

  // ---------- Helpers (ported from your Three.js) ----------

  function createSpherePositions(
    radius = 1,
    widthSegs = 32,
    heightSegs = 16
  ): Float32Array {
    const verts: number[] = [];
    for (let y = 0; y <= heightSegs; y++) {
      const v = y / heightSegs;
      const theta = v * Math.PI;
      const sinT = Math.sin(theta), cosT = Math.cos(theta);

      for (let x = 0; x <= widthSegs; x++) {
        const u = x / widthSegs;
        const phi = u * 2 * Math.PI;
        const sinP = Math.sin(phi), cosP = Math.cos(phi);

        verts.push(
          radius * sinT * cosP,
          radius * cosT,
          radius * sinT * sinP
        );
      }
    }
    return new Float32Array(verts);
  }

  function createSphereIndices(widthSegs = 32, heightSegs = 16): Uint32Array {
    const idx: number[] = [];
    const stride = widthSegs + 1;
    for (let y = 0; y < heightSegs; y++) {
      for (let x = 0; x < widthSegs; x++) {
        const i0 = y * stride + x;
        const i1 = i0 + 1;
        const i2 = i0 + stride;
        const i3 = i2 + 1;
        idx.push(i0, i1, i2); // lower-left
        idx.push(i1, i3, i2); // upper-right
      }
    }
    return new Uint32Array(idx);
  }


  window.addEventListener("resize", () => engine.resize());
  engine.runRenderLoop(() => 
    scene.render()
);
};

main();

