import CubeIcon from "../icons/CubeIcon";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

interface Props {
  model: THREE.Group;
  background?: number | string;
  style?: React.CSSProperties;
  className?: string;
  showAxes?: boolean;
  withActions?: ("camera" | ReactNode)[];
}

export function ThreeModelViewer({
  model,
  background,
  showAxes = true,
  withActions = [],
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<any>(null);
  const sizeRef = useRef<number>(50);
  const distRef = useRef<number>(40);
  const savedCameraRef = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);

  const views = {
    front: () => setView(new THREE.Vector3(0, 0, 1)),
    back: () => setView(new THREE.Vector3(0, 0, -1)),
    top: () => setView(new THREE.Vector3(0, 1, 0)),
    bottom: () => setView(new THREE.Vector3(0, -1, 0)),
    left: () => setView(new THREE.Vector3(1, 0, 0)),
    right: () => setView(new THREE.Vector3(-1, 0, 0)),
  };

  // Camera view setter, must be outside useEffect for dropdown
  // Set camera view direction, preserving current zoom (distance to target)
  const setView = (
    direction: THREE.Vector3,
    target: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  ) => {
    if (cameraRef.current && controlsRef.current) {
      // Get current distance from camera to controls target
      const currentTarget = controlsRef.current.target.clone();
      const cam = cameraRef.current;
      const distance = cam.position.distanceTo(currentTarget);
      // Normalize direction and set camera position
      const dir = direction.clone().normalize();
      cam.position.copy(target.clone().add(dir.multiplyScalar(distance)));
      cam.lookAt(target);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  };

  useEffect(() => {
    const mount = mountRef.current!;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // -------------------------
    // Scene & Camera
    // -------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background ?? 0x111111);

    scene.add(model);

    // Compute bounding sphere to position camera nicely
    const bounding = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    bounding.getCenter(center);
    const size = bounding.getSize(new THREE.Vector3()).length() || 50;
    sizeRef.current = size;
    distRef.current = size * 0.8;

    // Add axes helper if requested
    let axesHelper: THREE.AxesHelper | undefined;
    let labels: THREE.Sprite[] = [];
    if (showAxes) {
      axesHelper = new THREE.AxesHelper(size * 0.5);
      scene.add(axesHelper);
    }

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    if (savedCameraRef.current) {
      camera.position.copy(savedCameraRef.current.position);
    } else {
      camera.position.set(size * 0.8, size * 0.8, size * 0.8);
    }
    camera.lookAt(center);
    cameraRef.current = camera;

    // -------------------------
    // Renderer
    // -------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // -------------------------
    // Controls (OrbitControls)
    // -------------------------
    let controls: any;
    (async () => {
      const { OrbitControls } =
        await import("three/examples/jsm/controls/OrbitControls.js");
      controls = new OrbitControls(camera, renderer.domElement);

      // Enable panning explicitly
      controls.enablePan = true;

      // Optional: make panning feel nice
      controls.panSpeed = 1.0;
      controls.screenSpacePanning = true; // pan parallel to screen

      controls.target.copy(savedCameraRef.current?.target ?? center);
      controls.update();
      controlsRef.current = controls;
    })();

    // -------------------------
    // Lights
    // -------------------------
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(1, 1, 1);
    scene.add(dir);

    // -------------------------
    // Animation loop
    // -------------------------
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // -------------------------
    // Cleanup
    // -------------------------
    return () => {
      // Save camera state before teardown so it can be restored on re-mount
      if (cameraRef.current && controlsRef.current) {
        savedCameraRef.current = {
          position: cameraRef.current.position.clone(),
          target: controlsRef.current.target.clone(),
        };
      }

      cancelAnimationFrame(frame);

      // Dispose renderer
      renderer.dispose();

      // Remove axes helper
      if (axesHelper) {
        scene.remove(axesHelper);
      }

      // Remove axis labels
      for (const label of labels) {
        scene.remove(label);
        if (label.material.map) {
          label.material.map.dispose();
        }
        label.material.dispose();
      }

      // Remove canvas
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }

      // Optionally dispose geometries & materials
      model.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m?.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
    };
  }, [model, background, showAxes]);

  const withCameraAction = withActions.includes("camera");
  const otherActions = withActions.filter((action) => action !== "camera");

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          left: "1rem",
          bottom: "1rem",
          display: "flex",
          gap: "1rem",
          alignItems: "flex-end",
        }}
      >
        {withCameraAction && <CameraActionButton views={views} />}
        {otherActions}
      </div>
    </div>
  );
}

function CameraActionButton({
  views,
}: {
  views: Record<
    Exclude<Parameters<typeof CubeIcon>[0]["highlight"], undefined>,
    () => void
  >;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  function makeCameraViewButton(
    highlight: Exclude<Parameters<typeof CubeIcon>[0]["highlight"], undefined>,
  ) {
    return (
      <button
        key={highlight}
        className="floating"
        onClick={() => {
          views[highlight]();
          setIsDropdownOpen(false);
        }}
        title={highlight.charAt(0).toUpperCase() + highlight.slice(1)}
      >
        <CubeIcon highlight={highlight} />
      </button>
    );
  }

  return (
    <>
      <button
        className="floating"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        title="Set Camera View"
      >
        <CubeIcon />
      </button>
      {isDropdownOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "4rem",
            display: "grid",
            gridTemplateColumns: "repeat(2, auto)",
            gridTemplateRows: "repeat(3, auto)",
            gap: "1rem",
            alignItems: "flex-end",
          }}
        >
          {(["front", "back", "top", "bottom", "right", "left"] as const).map(
            makeCameraViewButton,
          )}
        </div>
      )}
    </>
  );
}
