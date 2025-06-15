"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
  PresentationControls,
  Stage,
  Center,
  AccumulativeShadows,
  RandomizedLight,
} from "@react-three/drei";
import { Suspense, Component, ReactNode, useRef, useEffect } from "react";
import * as THREE from "three";

interface CarModelProps {
  glbUrl: string;
  color?: string;
}

// Error boundary for 3D model loading
class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("3D Model loading failed:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function CarModel({ glbUrl, color }: CarModelProps) {
  const { scene, materials } = useGLTF(glbUrl);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene && materials) {
      // Enhance materials for better appearance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(materials).forEach(
        ([materialName, material]: [string, any]) => {
          if (material.isMeshStandardMaterial) {
            // Check if this material should get the custom color (only body panels)
            const isBodyMaterial = shouldApplyColorToMaterial(
              materialName,
              material
            );

            // Apply custom color only to body materials
            if (color && isBodyMaterial) {
              material.color.set(color);
              // Enhance metallic properties for realistic car paint
              material.metalness = Math.max(material.metalness, 0.8);
              material.roughness = Math.min(material.roughness, 0.3);
            }

            // Improve material properties for better reflections and lighting
            material.envMapIntensity = 1.5;
            if (!isBodyMaterial) {
              // Keep original properties for non-body materials
              material.roughness = Math.min(material.roughness * 0.9, 0.95);
              material.metalness = Math.max(material.metalness, 0.05);
            }
          }
        }
      );

      // Auto-center and scale the model to fill viewport properly
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Scale to fit nicely in view (car should take up about 70% of viewport)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 6 / maxDim; // Increased from 4 to 6 for larger appearance

      // Center the model
      scene.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale
      );
      scene.scale.setScalar(scale);

      // Position the model slightly above ground for better presentation
      scene.position.y += 0.1;
    }
  }, [scene, materials, color]);

  return (
    <Center ref={modelRef}>
      <primitive object={scene} />
    </Center>
  );
}

function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    // Position camera closer for better model visibility
    camera.position.set(5, 2.5, 5); // Moved closer: was [8, 4, 8]
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <p className="mt-4 text-sm text-white/70">Loading 3D model...</p>
      </div>
    </Html>
  );
}

function ErrorFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
          <div className="text-2xl">🚗</div>
        </div>
        <p className="text-sm text-white/70 mb-2">3D Model Demo</p>
        <p className="text-xs text-white/50">
          Upload your GLB file to see it here
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-white/40 mt-3">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
          <span>Model failed to load</span>
        </div>
      </div>
    </Html>
  );
}

interface CarModelViewerProps {
  glbUrl: string;
  className?: string;
  color?: string;
}

export default function CarModelViewer({
  glbUrl,
  className = "w-full h-96",
  color,
}: CarModelViewerProps) {
  if (!glbUrl) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-white/5 to-white/10 rounded-lg flex items-center justify-center border border-white/20 relative overflow-hidden`}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20 animate-pulse"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
            <div className="text-3xl">🚗</div>
          </div>
          <h4 className="text-lg font-semibold text-white/90 mb-2">
            3D Model Viewer
          </h4>
          <p className="text-sm text-white/60 mb-4 max-w-xs">
            Interactive 3D models will appear here when uploaded
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-white/50">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Ready for GLB upload</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [5, 2.5, 5], fov: 30 }}
        className="rounded-lg"
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        shadows
      >
        <CameraController />

        {/* Sketchfab-style environment and lighting */}
        <Environment
          preset="city"
          background={false}
          environmentIntensity={0.6}
        />

        {/* Studio-quality lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 8]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight position={[-10, 5, -5]} intensity={0.8} />
        <spotLight
          position={[0, 15, 0]}
          intensity={1.2}
          angle={0.4}
          penumbra={0.8}
          castShadow
        />

        {/* Rim lighting for better car definition */}
        <directionalLight
          position={[-5, 2, -5]}
          intensity={0.5}
          color="#4080ff"
        />
        <directionalLight
          position={[5, 2, 5]}
          intensity={0.3}
          color="#ff8040"
        />

        <ModelErrorBoundary fallback={<ErrorFallback />}>
          <Suspense fallback={<LoadingFallback />}>
            {/* Professional car presentation setup */}
            <PresentationControls
              speed={1.5}
              global
              zoom={1.2}
              polar={[-0.4, Math.PI / 4]}
              azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
              <Stage
                preset="rembrandt"
                intensity={0.6}
                environment="city"
                shadows={{
                  type: "accumulative",
                  color: "#d9d9d9",
                }}
                adjustCamera={false}
              >
                <CarModel glbUrl={glbUrl} color={color} />
              </Stage>
            </PresentationControls>

            {/* High-quality ground shadows */}
            <AccumulativeShadows
              temporal
              frames={60}
              alphaTest={0.85}
              scale={15}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, -4, 0]}
              color="#2d2d2d"
              opacity={0.8}
            >
              <RandomizedLight
                amount={4}
                radius={9}
                intensity={1.2}
                ambient={0.25}
                position={[5, 5, -10]}
              />
              <RandomizedLight
                amount={4}
                radius={5}
                intensity={0.8}
                ambient={0.55}
                position={[-5, 5, -9]}
              />
            </AccumulativeShadows>
          </Suspense>
        </ModelErrorBoundary>

        {/* Enhanced orbit controls for smooth interaction */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          minDistance={2}
          maxDistance={12}
          enableDamping={true}
          dampingFactor={0.02}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}

// Helper function to determine if a material should receive the custom color
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shouldApplyColorToMaterial(
  materialName: string,
  material: any
): boolean {
  const name = materialName.toLowerCase();

  // Exclude materials that should NOT be recolored
  const excludePatterns = [
    // Wheels and tires
    "wheel",
    "tire",
    "rim",
    "brake",
    "disc",
    "caliper",
    // Interior
    "interior",
    "seat",
    "dashboard",
    "steering",
    "console",
    // Glass and lights (expanded)
    "glass",
    "window",
    "windshield",
    "light",
    "headlight",
    "taillight",
    "lamp",
    "tail",
    "rear_light",
    "front_light",
    "fog",
    "turn",
    "signal",
    "indicator",
    "led",
    "bulb",
    "reflector",
    "lens",
    "beacon",
    // Chrome and metal parts
    "chrome",
    "grille",
    "badge",
    "emblem",
    "trim",
    "mirror",
    // License plates and decals
    "plate",
    "license",
    "decal",
    "sticker",
    "logo",
    "text",
    // Undercarriage
    "exhaust",
    "muffler",
    "engine",
    "suspension",
    "undercarriage",
    // Specific automotive parts
    "antenna",
    "wiper",
    "handle",
    "lock",
    "hinge",
  ];

  // Check if material name contains any excluded patterns
  const shouldExclude = excludePatterns.some((pattern) =>
    name.includes(pattern)
  );

  if (shouldExclude) return false;

  // Additional check for materials that might be lights based on color
  // Tail lights are typically red, so preserve red materials
  if (
    material.color &&
    material.color.r > 0.7 &&
    material.color.g < 0.3 &&
    material.color.b < 0.3
  ) {
    return false; // Don't recolor red materials (likely tail lights)
  }

  // Preserve materials that are very transparent (likely glass/lights)
  if (material.transparent && material.opacity < 0.9) {
    return false;
  }

  // Include materials that are likely body panels
  const bodyPatterns = [
    "body",
    "panel",
    "door",
    "hood",
    "trunk",
    "roof",
    "fender",
    "quarter",
    "side",
    "paint",
    "exterior",
    "bumper",
  ];

  const isBodyPanel = bodyPatterns.some((pattern) => name.includes(pattern));

  // If it's explicitly a body panel, include it
  if (isBodyPanel) return true;

  // For generic material names, use heuristics based on material properties
  // Body panels typically have moderate metalness and are not too rough
  const hasBodyLikeProperties =
    material.metalness !== undefined &&
    material.metalness > 0.1 &&
    material.metalness < 0.9 &&
    material.roughness !== undefined &&
    material.roughness > 0.2 && // Body paint isn't too shiny
    material.roughness < 0.8;

  // Be more conservative - only recolor if it really looks like a body panel
  return (
    hasBodyLikeProperties &&
    (name.includes("car") || name === "" || /^material[\d_]*$/i.test(name))
  );
}

// Preload the R34 model for better performance
useGLTF.preload("/demo/r34.glb");
