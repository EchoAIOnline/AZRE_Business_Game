import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraMode, DepartmentId } from '../types/office';
import { DEPARTMENTS } from '../data/departmentsData';
import { createDealDeskScreenTexture } from './DealDeskScreenRenderer';

interface Office3DProps {
  cameraMode: CameraMode;
  onSelectDepartment: (id: DepartmentId) => void;
  onOpenDealDesk: (dept: DepartmentId) => void;
  activeDepartment: DepartmentId | null;
  brightness?: number; // Bright lighting slider
}

export const Office3D: React.FC<Office3DProps> = ({
  cameraMode,
  onSelectDepartment,
  onOpenDealDesk,
  activeDepartment,
  brightness = 1.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);

  // References for animation and clean up
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Camera target interpolation
  const targetCamPos = useRef(new THREE.Vector3(14, 26, 22));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Specialist avatars references for procedural typing / idle animation
  const avatarsRef = useRef<{
    [key in DepartmentId]?: {
      group: THREE.Group;
      head: THREE.Mesh;
      leftArm: THREE.Mesh;
      rightArm: THREE.Mesh;
    };
  }>({});

  // Dynamic ref for cameraMode to prevent stale closures in animate() loop
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  // Screen update callbacks
  const screenUpdaters = useRef<((t: number) => void)[]>([]);

  // First-person walkthrough movement state
  const keysPressed = useRef<{ [k: string]: boolean }>({});
  const fpvYaw = useRef<number>(0);
  const fpvPitch = useRef<number>(0);
  const isPointerDown = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const dragDistanceRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- 1. SCENE SETUP ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.012);

    // --- 2. CAMERA ---
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 150);
    // Initial camera position matches the isometric 3D view of the floor plan
    camera.position.set(16, 26, 22);
    cameraRef.current = camera;

    // --- 3. RENDERER ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25 * brightness;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // --- 3B. ORBIT CONTROLS FOR FLOORPLAN 3D MOUSE MOVEMENT ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera from dipping below the floor
    controls.minDistance = 6;
    controls.maxDistance = 55;
    controls.target.set(0, 1.0, 0);
    controls.enabled = cameraModeRef.current === 'isometric';
    controlsRef.current = controls;

    // --- 4. BRIGHT ARCHITECTURAL LIGHTING SETUP ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfff8ee, 2.4);
    mainSun.position.set(16, 32, 14);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.camera.near = 0.5;
    mainSun.shadow.camera.far = 80;
    mainSun.shadow.camera.left = -25;
    mainSun.shadow.camera.right = 25;
    mainSun.shadow.camera.top = 25;
    mainSun.shadow.camera.bottom = -25;
    mainSun.shadow.bias = -0.0004;
    scene.add(mainSun);

    const softFillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    softFillLight.position.set(-18, 22, -14);
    scene.add(softFillLight);

    // Recessed ceiling spotlights for each of the 5 rooms and hallway
    const ceilingSpots: [number, number, number, number][] = [
      [-7.5, 5.8, -8.3, 0x10b981], // Acquisitions
      [-7.5, 5.8, 0, 0xf59e0b],    // Dispositions
      [-7.5, 5.8, 8.3, 0x38bdf8],   // Operations
      [8.0, 5.8, -6.2, 0xfacc15],   // CEO / Approvals
      [8.0, 5.8, 6.2, 0xa855f7],    // Deal Review
      [0, 5.8, -6, 0xffedd5],       // Hallway North
      [0, 5.8, 4, 0xffedd5],        // Hallway South
    ];

    ceilingSpots.forEach(([x, y, z, col]) => {
      const pLight = new THREE.PointLight(col, 1.5, 14, 1.3);
      pLight.position.set(x, y, z);
      scene.add(pLight);

      // Downlight fixture
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.08, 0.25),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      fixture.position.set(x, y + 0.1, z);
      scene.add(fixture);
    });

    // --- 5. MATERIALS ---
    const floorTileMat = new THREE.MeshStandardMaterial({
      color: 0x181e2b,
      roughness: 0.2,
      metalness: 0.25,
    });

    const runnerRugMat = new THREE.MeshStandardMaterial({
      color: 0x272f3e,
      roughness: 0.85,
    });

    const roomRugMat = new THREE.MeshStandardMaterial({
      color: 0x333e50,
      roughness: 0.8,
    });

    const darkWallMat = new THREE.MeshStandardMaterial({
      color: 0x1a2130,
      roughness: 0.45,
      metalness: 0.15,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.32,
      roughness: 0.06,
      transmission: 0.75,
      ior: 1.5,
      thickness: 0.15,
      depthWrite: false,
    });

    const darkMullionMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.2,
    });

    const marbleDeskMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.1,
    });

    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });

    // --- 6. ARCHITECTURAL FLOORPLAN LAYOUT ---
    // Total Office Footprint: X: -13.5 to 14.5 (width 28m), Z: -13.5 to 13.5 (length 27m)
    const mainFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 28), floorTileMat);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.receiveShadow = true;
    scene.add(mainFloor);

    // Floor Grid Tile Lines
    const gridHelper = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Central Corridor Runner Rug (X: 0, from Z: -12.5 to 11.5)
    const runnerRug = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.02, 23.5), runnerRugMat);
    runnerRug.position.set(0, 0.015, -0.5);
    runnerRug.receiveShadow = true;
    scene.add(runnerRug);

    // Linear Warm Light Strips along Hallway Floor Edges (Matching the Floor Plan image!)
    const makeLinearFloorStrip = (x: number) => {
      const stripMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 23.5),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      stripMesh.position.set(x, 0.02, -0.5);
      scene.add(stripMesh);

      // Floor glow pointlights along the corridor
      [-8, -2, 4].forEach((pz) => {
        const glowPoint = new THREE.PointLight(0xf59e0b, 0.8, 6, 1.8);
        glowPoint.position.set(x, 0.25, pz);
        scene.add(glowPoint);
      });
    };
    makeLinearFloorStrip(-2.3);
    makeLinearFloorStrip(2.3);

    // Helper: Build Wall Segment
    const addWall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkWallMat);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      return wall;
    };

    // Helper: Build Glass Partition Segment with Header
    const addGlassPartition = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      accentColorHex: number
    ) => {
      const group = new THREE.Group();
      // Glass pane
      const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat);
      glass.position.set(0, h / 2, 0);
      group.add(glass);

      // Dark Frame Header
      const header = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.2, d + 0.08),
        darkMullionMat
      );
      header.position.set(0, h + 0.1, 0);
      group.add(header);

      // Illuminated Accent Edge
      const accent = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.05, 0.05),
        new THREE.MeshBasicMaterial({ color: accentColorHex })
      );
      accent.position.set(0, h + 0.22, 0);
      group.add(accent);

      group.position.set(x, y, z);
      scene.add(group);
      return group;
    };

    // Helper: Build Suite Luminous Signboard
    const addSuiteSign = (
      name: string,
      x: number,
      y: number,
      z: number,
      rotY: number,
      colorHex: string
    ) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const sctx = canvas.getContext('2d')!;
      sctx.fillStyle = '#0b1120';
      sctx.fillRect(0, 0, 512, 128);
      sctx.strokeStyle = colorHex;
      sctx.lineWidth = 4;
      sctx.strokeRect(4, 4, 504, 120);

      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      sctx.textAlign = 'center';
      sctx.fillText(name.toUpperCase(), 256, 52);

      sctx.font = 'bold 18px monospace';
      sctx.fillStyle = '#00ff66';
      sctx.fillText('ASHARI ZAKAR REAL ESTATE', 256, 92);

      const signTex = new THREE.CanvasTexture(canvas);
      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.0, 0.75),
        new THREE.MeshBasicMaterial({ map: signTex })
      );
      signMesh.position.set(x, y, z);
      signMesh.rotation.y = rotY;
      scene.add(signMesh);
    };

    // --- 7. EXTERIOR BOUNDARY WALLS & WINDOWS ---
    const wallHeight = 4.8;
    // North Back Wall (Z = -13.0)
    addWall(28, wallHeight, 0.4, 0.5, wallHeight / 2, -13.0);
    // West Outer Wall with Ribbon Windows (X = -13.0)
    addWall(0.4, wallHeight, 26, -13.0, wallHeight / 2, 0);
    // East Outer Wall with Ribbon Windows (X = 14.0)
    addWall(0.4, wallHeight, 26, 14.0, wallHeight / 2, 0);
    // South Front Wall (Left and Right of Entry)
    addWall(10.5, wallHeight, 0.4, -7.8, wallHeight / 2, 12.8);
    addWall(11.5, wallHeight, 0.4, 8.2, wallHeight / 2, 12.8);

    // --- 8. CENTRAL CORRIDOR GLASS PARTITIONS & DOORS ---
    // Left corridor wall dividing Hallway from Acquisitions, Dispositions, Operations (X = -2.5)
    // Three door openings (width 1.4m each) for each department
    // Segment 1: Acquisitions Glass (Z: -12.5 to -4.2, door at Z = -6)
    addGlassPartition(0.1, wallHeight, 5.0, -2.5, 0, -9.8, 0x10b981);
    addGlassPartition(0.1, wallHeight, 2.2, -2.5, 0, -4.8, 0x10b981);
    addSuiteSign('Acquisitions', -2.4, 3.8, -7.2, -Math.PI / 2, '#10b981');

    // Segment 2: Dispositions Glass (Z: -4.2 to 4.2, door at Z = 1.8)
    addGlassPartition(0.1, wallHeight, 5.4, -2.5, 0, -1.2, 0xf59e0b);
    addGlassPartition(0.1, wallHeight, 1.8, -2.5, 0, 3.2, 0xf59e0b);
    addSuiteSign('Dispositions', -2.4, 3.8, 0.2, -Math.PI / 2, '#f59e0b');

    // Segment 3: Operations Glass (Z: 4.2 to 12.5, door at Z = 9.8)
    addGlassPartition(0.1, wallHeight, 5.2, -2.5, 0, 6.8, 0x38bdf8);
    addGlassPartition(0.1, wallHeight, 2.0, -2.5, 0, 11.6, 0x38bdf8);
    addSuiteSign('Operations', -2.4, 3.8, 8.2, -Math.PI / 2, '#38bdf8');

    // Interior Dividers between Left Suites:
    // Wall between Acquisitions and Dispositions (Z = -4.2, X: -13 to -2.5)
    addWall(10.4, wallHeight, 0.2, -7.7, wallHeight / 2, -4.2);
    // Wall between Dispositions and Operations (Z = 4.2, X: -13 to -2.5)
    addWall(10.4, wallHeight, 0.2, -7.7, wallHeight / 2, 4.2);

    // Right corridor wall dividing Hallway from CEO / Approvals and Deal Review (X = 2.5)
    // Segment 4: CEO / Approvals Glass (Z: -12.5 to 0, door at Z = -3.5)
    addGlassPartition(0.1, wallHeight, 7.5, 2.5, 0, -8.2, 0xeab308);
    addGlassPartition(0.1, wallHeight, 2.8, 2.5, 0, -1.4, 0xeab308);
    addSuiteSign('CEO / Approvals', 2.4, 3.8, -4.8, Math.PI / 2, '#eab308');

    // Segment 5: Deal Review Glass (Z: 0 to 12.5, door at Z = 3.5)
    addGlassPartition(0.1, wallHeight, 3.0, 2.5, 0, 1.6, 0xa855f7);
    addGlassPartition(0.1, wallHeight, 7.2, 2.5, 0, 7.8, 0xa855f7);
    addSuiteSign('Deal Review', 2.4, 3.8, 5.0, Math.PI / 2, '#a855f7');

    // Interior Divider between CEO and Deal Review (Z = 0, X: 2.5 to 14)
    addWall(11.4, wallHeight, 0.2, 8.2, wallHeight / 2, 0);

    // --- 9. SOUTH ENTRANCE (ENTRY) ---
    // Glass double doors at X = 0, Z = 12.8
    const entryMat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.03, 1.8), darkWallMat);
    entryMat.position.set(0, 0.02, 13.6);
    scene.add(entryMat);

    // Double glass swing doors
    const door1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.4, 0.08), glassMat);
    door1.position.set(-0.7, 1.7, 12.8);
    scene.add(door1);
    const door2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.4, 0.08), glassMat);
    door2.position.set(0.7, 1.7, 12.8);
    scene.add(door2);

    // Brass handles
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 12);
    const h1 = new THREE.Mesh(handleGeo, goldAccentMat);
    h1.position.set(-0.2, 1.5, 12.88);
    scene.add(h1);
    const h2 = new THREE.Mesh(handleGeo, goldAccentMat);
    h2.position.set(0.2, 1.5, 12.88);
    scene.add(h2);

    // Entry sign plate
    const entryPlateCanvas = document.createElement('canvas');
    entryPlateCanvas.width = 256;
    entryPlateCanvas.height = 64;
    const ectx = entryPlateCanvas.getContext('2d')!;
    ectx.fillStyle = '#0f172a';
    ectx.fillRect(0, 0, 256, 64);
    ectx.fillStyle = '#ffffff';
    ectx.font = 'bold 24px monospace';
    ectx.textAlign = 'center';
    ectx.fillText('ENTRY', 128, 40);

    const epMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(entryPlateCanvas) })
    );
    epMesh.rotation.x = -Math.PI / 2;
    epMesh.position.set(0, 0.04, 13.8);
    scene.add(epMesh);

    // --- 10. HELPER: POTTED PLANTS & FURNITURE ---
    const addPlant = (px: number, pz: number, scale = 1) => {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28 * scale, 0.2 * scale, 0.6 * scale, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
      );
      pot.position.set(px, 0.3 * scale, pz);
      scene.add(pot);

      const foliage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.48 * scale, 1),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
      );
      foliage.position.set(px, 0.82 * scale, pz);
      scene.add(foliage);
    };

    // Corridor & Entry Plants (Matching Floor Plan layout!)
    addPlant(-1.8, 13.4, 1.2);
    addPlant(1.8, 13.4, 1.2);
    addPlant(-2.0, 9.6);
    addPlant(-2.0, 1.6);
    addPlant(-2.0, -6.2);
    addPlant(2.0, -3.2);
    addPlant(2.0, 3.2);

    // Guest Armchair
    const addGuestChair = (x: number, z: number, rotY: number) => {
      const chairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
      const chairGroup = new THREE.Group();
      chairGroup.position.set(x, 0, z);
      chairGroup.rotation.y = rotY;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.15, 0.75), chairMat);
      seat.position.set(0, 0.45, 0);
      chairGroup.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.14), chairMat);
      back.position.set(0, 0.75, 0.35);
      chairGroup.add(back);

      scene.add(chairGroup);
    };

    // --- 11. WORKSTATION GENERATOR (Left 3 Suites) ---
    const buildDepartmentWorkstation = (
      dept: DepartmentId,
      cx: number,
      cz: number,
      specialistName: string
    ) => {
      const group = new THREE.Group();
      group.position.set(cx, 0, cz);

      // Area Rug under desk
      const rug = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.02, 5.2), roomRugMat);
      rug.position.set(0, 0.015, 0);
      rug.receiveShadow = true;
      group.add(rug);

      // White Calacatta Executive Marble Desk (Facing Hallway)
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.8), marbleDeskMat);
      deskTop.position.set(0, 1.05, -0.6);
      deskTop.castShadow = true;
      deskTop.receiveShadow = true;
      group.add(deskTop);

      // Desk base pedestal / dark frame
      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.98, 1.6),
        darkMullionMat
      );
      pedestal.position.set(0, 0.49, -0.6);
      group.add(pedestal);

      // Ergonomic Executive Chair
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), chairMat);
      chairSeat.position.set(0, 0.75, -1.6);
      group.add(chairSeat);

      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.85, 0.12), chairMat);
      chairBack.position.set(0, 1.25, -2.0);
      group.add(chairBack);

      // Guest Armchair in room facing desk
      addGuestChair(cx + 2.2, cz + 1.2, -Math.PI / 4);

      // Side table
      const sideTable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16),
        darkMullionMat
      );
      sideTable.position.set(cx + 2.8, 0.3, cz + 0.2);
      scene.add(sideTable);

      // Triple Curved Screens running DealDesk Ultra - turned around to face the AI agent
      const { texture: screenTex, update: updateScreen } = createDealDeskScreenTexture(dept);
      screenUpdaters.current.push(updateScreen);

      const monitorFrameMat = new THREE.MeshStandardMaterial({
        color: 0x020617,
        metalness: 0.8,
        roughness: 0.3,
      });
      const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });

      // Center Monitor: Turned around 180 degrees (Math.PI) to directly face the AI agent
      const centerMon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 0.06), monitorFrameMat);
      const centerScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.87), screenMat);
      centerScreen.position.z = 0.035;
      centerMon.add(centerScreen);
      centerMon.position.set(0, 1.72, -0.2);
      centerMon.rotation.y = Math.PI; // Face toward AI agent at -Z
      group.add(centerMon);

      // Left curved monitor (curved inward toward AI agent)
      const leftMon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.06), monitorFrameMat);
      const leftScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.78), screenMat);
      leftScreen.position.z = 0.035;
      leftMon.add(leftScreen);
      leftMon.position.set(-1.3, 1.72, -0.32);
      leftMon.rotation.y = Math.PI - 0.35; // Angled toward AI agent
      group.add(leftMon);

      // Right curved monitor (curved inward toward AI agent)
      const rightMon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.06), monitorFrameMat);
      const rightScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.78), screenMat);
      rightScreen.position.z = 0.035;
      rightMon.add(rightScreen);
      rightMon.position.set(1.3, 1.72, -0.32);
      rightMon.rotation.y = Math.PI + 0.35; // Angled toward AI agent
      group.add(rightMon);

      // Monitor Stand / Post on desk
      const standPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.65, 12),
        darkMullionMat
      );
      standPost.position.set(0, 1.38, -0.2);
      group.add(standPost);

      const standBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.03, 0.35),
        darkMullionMat
      );
      standBase.position.set(0, 1.12, -0.2);
      group.add(standBase);

      // Keyboard in front of the AI agent
      const keyboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.02, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      );
      keyboard.position.set(0, 1.12, -1.0);
      group.add(keyboard);

      // Mouse beside keyboard
      const mouseDesk = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.025, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      );
      mouseDesk.position.set(0.55, 1.12, -1.0);
      group.add(mouseDesk);

      // Specialist Avatar (Seated at desk typing)
      const avatarGroup = new THREE.Group();
      avatarGroup.position.set(0, 0, -1.6);

      const suitColor =
        dept === 'acquisitions'
          ? 0x1e293b
          : dept === 'dispositions'
          ? 0x1e3a8a
          : 0x334155;

      const legs = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.7, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      legs.position.set(0, 0.45, 0.2);
      avatarGroup.add(legs);

      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.65, 0.35),
        new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.6 })
      );
      torso.position.set(0, 1.18, 0);
      torso.castShadow = true;
      avatarGroup.add(torso);

      // Tie
      const tieColor =
        dept === 'acquisitions' ? 0x10b981 : dept === 'dispositions' ? 0xf59e0b : 0x38bdf8;
      const tie = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.38, 0.04),
        new THREE.MeshStandardMaterial({ color: tieColor })
      );
      tie.position.set(0, 1.25, 0.18);
      avatarGroup.add(tie);

      // Head
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.3, 0.28),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 })
      );
      head.position.set(0, 1.68, 0);
      head.castShadow = true;
      avatarGroup.add(head);

      // Hair
      const hair = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.12, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x1c1917 })
      );
      hair.position.set(0, 1.84, 0);
      avatarGroup.add(hair);

      // Typing arms
      const leftArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.5),
        new THREE.MeshStandardMaterial({ color: suitColor })
      );
      leftArm.position.set(-0.22, 1.12, 0.45);
      avatarGroup.add(leftArm);

      const rightArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.5),
        new THREE.MeshStandardMaterial({ color: suitColor })
      );
      rightArm.position.set(0.22, 1.12, 0.45);
      avatarGroup.add(rightArm);

      group.add(avatarGroup);

      // Interactive Click Hitbox
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(5.0, 3.2, 4.0),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.set(0, 1.6, 0);
      hitbox.userData = { dept, isWorkstation: true };
      group.add(hitbox);

      scene.add(group);

      avatarsRef.current[dept] = {
        group: avatarGroup,
        head,
        leftArm,
        rightArm,
      };
    };

    // Build the 3 Left Suites (Matching the Floor Plan):
    // 1. Acquisitions (Top Left)
    buildDepartmentWorkstation('acquisitions', -7.5, -8.3, 'Marcus Vance');
    addPlant(-11.5, -11.5, 1.3);
    addPlant(-11.5, -5.5);

    // 2. Dispositions (Middle Left)
    buildDepartmentWorkstation('dispositions', -7.5, 0, 'Elena Rostova');
    addPlant(-11.5, -3.0);
    addPlant(-11.5, 3.0);

    // 3. Operations (Bottom Left)
    buildDepartmentWorkstation('operations', -7.5, 8.3, 'David Sterling');
    addPlant(-11.5, 5.5);
    addPlant(-11.5, 11.5, 1.3);

    // --- 12. CEO / APPROVALS SUITE (Top Right Suite: X = 8.0, Z = -6.2) ---
    const buildCeoSuite = () => {
      const group = new THREE.Group();
      group.position.set(8.0, 0, -6.2);

      // Executive Area Rug
      const rug = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.02, 7.8), roomRugMat);
      rug.position.set(0, 0.015, 0);
      group.add(rug);

      // Executive Marble & Gold Desk
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 2.0), marbleDeskMat);
      deskTop.position.set(0, 1.05, -0.6);
      deskTop.castShadow = true;
      group.add(deskTop);

      const goldFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.98, 1.8), goldAccentMat);
      goldFrame.position.set(0, 0.49, -0.6);
      group.add(goldFrame);

      // Laptop & Lamp on desk
      const laptop = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.03, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
      );
      laptop.position.set(0, 1.14, -0.5);
      group.add(laptop);

      // Executive Chair
      const chairSeat = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.12, 0.85),
        new THREE.MeshStandardMaterial({ color: 0x020617 })
      );
      chairSeat.position.set(0, 0.75, -1.8);
      group.add(chairSeat);

      const chairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.95, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x020617 })
      );
      chairBack.position.set(0, 1.3, -2.25);
      group.add(chairBack);

      // Credenza / Console on back wall
      const credenza = new THREE.Mesh(
        new THREE.BoxGeometry(5.0, 1.1, 0.8),
        darkMullionMat
      );
      credenza.position.set(0, 0.55, -4.8);
      group.add(credenza);

      // Large Wall-Mounted Display / Landscape Artwork Screen
      const { texture: ceoScreenTex, update: updateCeoScreen } = createDealDeskScreenTexture('ceo');
      screenUpdaters.current.push(updateCeoScreen);

      const artScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 1.8),
        new THREE.MeshBasicMaterial({ map: ceoScreenTex })
      );
      artScreen.position.set(0, 3.0, -5.15);
      group.add(artScreen);

      // CEO Avatar (Managing Principal Ashari Zakar)
      const avatarGroup = new THREE.Group();
      avatarGroup.position.set(0, 0, -1.8);

      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.68, 0.36),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
      );
      torso.position.set(0, 1.2, 0);
      avatarGroup.add(torso);

      // Gold executive tie
      const tie = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.38, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b })
      );
      tie.position.set(0, 1.25, 0.19);
      avatarGroup.add(tie);

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.3, 0.28),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 })
      );
      head.position.set(0, 1.7, 0);
      avatarGroup.add(head);

      const hair = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.12, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x18181b })
      );
      hair.position.set(0, 1.86, 0);
      avatarGroup.add(hair);

      const leftArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      leftArm.position.set(-0.25, 1.15, 0.35);
      avatarGroup.add(leftArm);

      const rightArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      rightArm.position.set(0.25, 1.15, 0.35);
      avatarGroup.add(rightArm);

      group.add(avatarGroup);

      // Interactive Hitbox
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(6.0, 3.5, 5.0),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.set(0, 1.6, 0);
      hitbox.userData = { dept: 'ceo', isWorkstation: true };
      group.add(hitbox);

      scene.add(group);

      avatarsRef.current['ceo'] = {
        group: avatarGroup,
        head,
        leftArm,
        rightArm,
      };

      addPlant(12.5, -11.5, 1.4);
      addPlant(4.0, -11.5);
    };
    buildCeoSuite();

    // --- 13. DEAL REVIEW CONFERENCE SUITE (Bottom Right: X = 8.0, Z = 6.2) ---
    const buildDealReviewSuite = () => {
      const group = new THREE.Group();
      group.position.set(8.0, 0, 6.2);

      // Conference Room Rug
      const rug = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.02, 8.5), roomRugMat);
      rug.position.set(0, 0.015, 0);
      group.add(rug);

      // Large White Marble Conference Table
      const confTable = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.14, 2.4),
        marbleDeskMat
      );
      confTable.position.set(0, 1.05, 0);
      confTable.castShadow = true;
      group.add(confTable);

      const confBase = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.98, 1.8),
        darkMullionMat
      );
      confBase.position.set(0, 0.49, 0);
      group.add(confBase);

      // Table Centerpiece greenery
      const centerpiece = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.12, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x166534 })
      );
      centerpiece.position.set(0, 1.16, 0);
      group.add(centerpiece);

      // 8 Executive Conference Chairs
      const chairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
      const addConfChair = (cx: number, cz: number, rotY: number) => {
        const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.65), chairMat);
        cSeat.position.set(cx, 0.55, cz);
        const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.1), chairMat);
        cBack.position.set(
          cx - Math.sin(rotY) * 0.32,
          0.85,
          cz - Math.cos(rotY) * 0.32
        );
        cBack.rotation.y = rotY;
        group.add(cSeat);
        group.add(cBack);
      };

      // Top row (3 chairs)
      [-1.4, 0, 1.4].forEach((px) => addConfChair(px, -1.6, 0));
      // Bottom row (3 chairs)
      [-1.4, 0, 1.4].forEach((px) => addConfChair(px, 1.6, Math.PI));
      // End chairs (2 chairs)
      addConfChair(-2.8, 0, Math.PI / 2);
      addConfChair(2.8, 0, -Math.PI / 2);

      // Large Presentation Screen on Right Wall (X = 13.8)
      const { texture: reviewTex, update: updateReview } = createDealDeskScreenTexture('deal-review');
      screenUpdaters.current.push(updateReview);

      const presScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 2.4),
        new THREE.MeshBasicMaterial({ map: reviewTex })
      );
      presScreen.position.set(5.75, 2.7, 0);
      presScreen.rotation.y = -Math.PI / 2;
      group.add(presScreen);

      // Interactive Hitbox
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 3.5, 5.5),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.set(0, 1.6, 0);
      hitbox.userData = { dept: 'deal-review', isWorkstation: true };
      group.add(hitbox);

      scene.add(group);

      addPlant(12.5, 11.5, 1.4);
      addPlant(4.0, 11.5);
    };
    buildDealReviewSuite();

    // --- 14. INTERACTION: RAYCASTING ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // FPV camera rotation handling
      if (cameraModeRef.current === 'fpv' && isPointerDown.current) {
        const deltaX = e.clientX - prevMousePos.current.x;
        const deltaY = e.clientY - prevMousePos.current.y;
        const dist = Math.hypot(deltaX, deltaY);
        dragDistanceRef.current += dist;
        if (dragDistanceRef.current > 4) {
          hasDraggedRef.current = true;
        }
        fpvYaw.current -= deltaX * 0.005;
        fpvPitch.current = Math.max(-0.7, Math.min(0.7, fpvPitch.current - deltaY * 0.005));
        prevMousePos.current = { x: e.clientX, y: e.clientY };
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find((i) => i.object.userData?.isWorkstation);

      if (hit && hit.object.userData.dept) {
        setHoveredTarget(hit.object.userData.dept);
        container.style.cursor = 'pointer';
      } else {
        setHoveredTarget(null);
        container.style.cursor = cameraModeRef.current === 'fpv' ? 'grab' : 'default';
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      isPointerDown.current = true;
      hasDraggedRef.current = false;
      dragDistanceRef.current = 0;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
      if (cameraModeRef.current === 'fpv') {
        container.style.cursor = 'grabbing';
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      isPointerDown.current = false;
      if (container) {
        container.style.cursor = cameraModeRef.current === 'fpv' ? 'grab' : 'default';
      }

      if (!hasDraggedRef.current) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const hit = intersects.find((i) => i.object.userData?.isWorkstation);

        if (hit && hit.object.userData.dept) {
          const dept = hit.object.userData.dept as DepartmentId;
          onSelectDepartment(dept);
          onOpenDealDesk(dept);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();
      keysPressed.current[key] = true;
      keysPressed.current[code] = true;

      if (cameraModeRef.current === 'fpv') {
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(key)) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();
      keysPressed.current[key] = false;
      keysPressed.current[code] = false;
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- 15. ANIMATION LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Update screen textures
      screenUpdaters.current.forEach((fn) => fn(elapsedTime));

      // Procedural avatar typing animations
      Object.entries(avatarsRef.current).forEach(([_, av]) => {
        if (!av) return;
        const typingSpeed = 16;
        av.leftArm.position.z = 0.45 + Math.sin(elapsedTime * typingSpeed) * 0.02;
        av.rightArm.position.z = 0.45 + Math.cos(elapsedTime * typingSpeed * 0.8) * 0.02;
        av.head.rotation.y = Math.sin(elapsedTime * 0.9) * 0.28;
      });

      // Camera Movement Logic
      if (cameraModeRef.current === 'fpv') {
        const moveSpeed = 0.18;
        const turnSpeed = 0.035;

        if (keysPressed.current['arrowleft'] || keysPressed.current['keyq']) {
          fpvYaw.current += turnSpeed;
        }
        if (keysPressed.current['arrowright'] || keysPressed.current['keye']) {
          fpvYaw.current -= turnSpeed;
        }

        const forward = new THREE.Vector3(-Math.sin(fpvYaw.current), 0, -Math.cos(fpvYaw.current));
        const right = new THREE.Vector3(Math.cos(fpvYaw.current), 0, -Math.sin(fpvYaw.current));

        if (keysPressed.current['w'] || keysPressed.current['keyw'] || keysPressed.current['arrowup']) {
          targetCamPos.current.addScaledVector(forward, moveSpeed);
        }
        if (keysPressed.current['s'] || keysPressed.current['keys'] || keysPressed.current['arrowdown']) {
          targetCamPos.current.addScaledVector(forward, -moveSpeed);
        }
        if (keysPressed.current['a'] || keysPressed.current['keya']) {
          targetCamPos.current.addScaledVector(right, -moveSpeed);
        }
        if (keysPressed.current['d'] || keysPressed.current['keyd']) {
          targetCamPos.current.addScaledVector(right, moveSpeed);
        }

        // Clamp camera within office boundary
        targetCamPos.current.x = Math.max(-11.5, Math.min(12.5, targetCamPos.current.x));
        targetCamPos.current.z = Math.max(-11.5, Math.min(12.5, targetCamPos.current.z));
        targetCamPos.current.y = 1.85; // Standing eye level

        const lookDir = new THREE.Vector3(
          -Math.sin(fpvYaw.current) * Math.cos(fpvPitch.current),
          Math.sin(fpvPitch.current),
          -Math.cos(fpvYaw.current) * Math.cos(fpvPitch.current)
        );
        targetLookAt.current.copy(targetCamPos.current).add(lookDir);

        camera.position.lerp(targetCamPos.current, 0.25);
        currentLookAt.current.lerp(targetLookAt.current, 0.35);
        camera.lookAt(currentLookAt.current);
      } else if (cameraModeRef.current === 'isometric') {
        // In Floorplan 3D view: OrbitControls enables mouse rotation, panning, and zooming!
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
      } else {
        // Smoothly zoom into desk preset
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
        camera.position.lerp(targetCamPos.current, 0.06);
        currentLookAt.current.lerp(targetLookAt.current, 0.08);
        camera.lookAt(currentLookAt.current);
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      renderer.dispose();
    };
  }, []);

  // Update brightness tone mapping
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = 1.25 * brightness;
    }
  }, [brightness]);

  // Handle Camera Mode Changes matching the floorplan
  useEffect(() => {
    if (cameraMode === 'isometric') {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.target.set(0, 1.0, 0);
      }
      targetCamPos.current.set(16, 26, 22);
      targetLookAt.current.set(0, 1.0, 0);
    } else {
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      if (cameraMode === 'acquisitions') {
        targetCamPos.current.set(-7.5, 2.4, -5.2);
        targetLookAt.current.set(-7.5, 1.45, -8.3);
      } else if (cameraMode === 'dispositions') {
        targetCamPos.current.set(-7.5, 2.4, 3.2);
        targetLookAt.current.set(-7.5, 1.45, 0);
      } else if (cameraMode === 'operations') {
        targetCamPos.current.set(-7.5, 2.4, 11.4);
        targetLookAt.current.set(-7.5, 1.45, 8.3);
      } else if (cameraMode === 'ceo') {
        targetCamPos.current.set(8.0, 2.4, -3.2);
        targetLookAt.current.set(8.0, 1.5, -6.2);
      } else if (cameraMode === 'deal-review') {
        targetCamPos.current.set(8.0, 2.5, 2.5);
        targetLookAt.current.set(8.0, 1.35, 6.2);
      } else if (cameraMode === 'entry') {
        targetCamPos.current.set(0, 2.2, 14.5);
        targetLookAt.current.set(0, 1.7, 5.0);
      } else if (cameraMode === 'fpv') {
        targetCamPos.current.set(0, 1.85, 12.0); // Starts right at the ENTRY doors facing North
        if (cameraRef.current) {
          cameraRef.current.position.set(0, 1.85, 12.0);
        }
        fpvYaw.current = 0;
        fpvPitch.current = 0;
      }
    }
  }, [cameraMode]);

  const handleVirtualKey = (key: string, isDown: boolean) => {
    keysPressed.current[key] = isDown;
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* ThreeJS WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Hover Station Indicator Card */}
      {hoveredTarget && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-fade-in">
          <div className="bg-slate-900/90 border border-emerald-500/50 backdrop-blur-md px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="text-xs uppercase font-extrabold text-white tracking-wider">
                {DEPARTMENTS.find((d) => d.id === hoveredTarget)?.name}
              </p>
              <p className="text-[11px] text-emerald-300 font-mono">
                Click to inspect live DealDesk screen & underwriting
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FPV Navigation Controls & Virtual D-Pad */}
      {cameraMode === 'fpv' && (
        <div className="absolute top-24 left-4 z-30 flex flex-col gap-2">
          <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs text-slate-300 font-mono shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">FPV WALK ACTIVE</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">Drag mouse to look around</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-3 rounded-2xl shadow-2xl flex flex-col items-center gap-1.5 w-48">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-0.5">
              Walk & Turn Controls
            </span>

            {/* Forward */}
            <button
              onMouseDown={() => handleVirtualKey('arrowup', true)}
              onMouseUp={() => handleVirtualKey('arrowup', false)}
              onMouseLeave={() => handleVirtualKey('arrowup', false)}
              onTouchStart={() => handleVirtualKey('arrowup', true)}
              onTouchEnd={() => handleVirtualKey('arrowup', false)}
              className="w-11 h-10 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center transition-colors border border-slate-700 shadow-sm"
              title="Walk Forward (Up Arrow / W)"
            >
              ↑
            </button>

            {/* Middle Row: Turn Left, Backward, Turn Right */}
            <div className="flex items-center gap-1.5">
              <button
                onMouseDown={() => handleVirtualKey('arrowleft', true)}
                onMouseUp={() => handleVirtualKey('arrowleft', false)}
                onMouseLeave={() => handleVirtualKey('arrowleft', false)}
                onTouchStart={() => handleVirtualKey('arrowleft', true)}
                onTouchEnd={() => handleVirtualKey('arrowleft', false)}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center transition-colors border border-slate-700 shadow-sm text-xs"
                title="Turn Left (Left Arrow / Q)"
              >
                ↶
              </button>

              <button
                onMouseDown={() => handleVirtualKey('arrowdown', true)}
                onMouseUp={() => handleVirtualKey('arrowdown', false)}
                onMouseLeave={() => handleVirtualKey('arrowdown', false)}
                onTouchStart={() => handleVirtualKey('arrowdown', true)}
                onTouchEnd={() => handleVirtualKey('arrowdown', false)}
                className="w-11 h-10 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center transition-colors border border-slate-700 shadow-sm"
                title="Walk Backward (Down Arrow / S)"
              >
                ↓
              </button>

              <button
                onMouseDown={() => handleVirtualKey('arrowright', true)}
                onMouseUp={() => handleVirtualKey('arrowright', false)}
                onMouseLeave={() => handleVirtualKey('arrowright', false)}
                onTouchStart={() => handleVirtualKey('arrowright', true)}
                onTouchEnd={() => handleVirtualKey('arrowright', false)}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center transition-colors border border-slate-700 shadow-sm text-xs"
                title="Turn Right (Right Arrow / E)"
              >
                ↷
              </button>
            </div>

            {/* Bottom Row: Strafe Left & Strafe Right */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800 w-full justify-center">
              <button
                onMouseDown={() => handleVirtualKey('a', true)}
                onMouseUp={() => handleVirtualKey('a', false)}
                onMouseLeave={() => handleVirtualKey('a', false)}
                onTouchStart={() => handleVirtualKey('a', true)}
                onTouchEnd={() => handleVirtualKey('a', false)}
                className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded text-slate-300 font-mono transition-colors border border-slate-700"
                title="Strafe Left (A)"
              >
                ← Strafe
              </button>
              <button
                onMouseDown={() => handleVirtualKey('d', true)}
                onMouseUp={() => handleVirtualKey('d', false)}
                onMouseLeave={() => handleVirtualKey('d', false)}
                onTouchStart={() => handleVirtualKey('d', true)}
                onTouchEnd={() => handleVirtualKey('d', false)}
                className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded text-slate-300 font-mono transition-colors border border-slate-700"
                title="Strafe Right (D)"
              >
                Strafe →
              </button>
            </div>

            <p className="text-[9px] text-slate-500 font-mono text-center mt-1">
              Keyboard: Arrow Keys / WASD
            </p>
          </div>
        </div>
      )}

      {/* Floorplan 3D Mouse Movement Hint */}
      {cameraMode === 'isometric' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-fade-in">
          <div className="bg-slate-900/85 border border-slate-700/80 backdrop-blur-md px-4 py-2 rounded-full text-xs text-slate-300 font-mono shadow-xl flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold">Floorplan 3D Active</span>
            <span className="text-slate-500">·</span>
            <span>Drag mouse to rotate</span>
            <span className="text-slate-500">·</span>
            <span>Right-click to pan</span>
            <span className="text-slate-500">·</span>
            <span>Scroll to zoom</span>
          </div>
        </div>
      )}
    </div>
  );
};
