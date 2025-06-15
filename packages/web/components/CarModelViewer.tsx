"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Loader } from "@react-three/drei";
import { Suspense } from "react";

interface CarModelProps {
  glbUrl: string;
}

function CarModel({ glbUrl }: CarModelProps) {
  const { scene } = useGLTF(glbUrl);
  
  return (
    <primitive 
      object={scene} 
      scale={[1, 1, 1]} 
      position={[0, -1, 0]}
    />
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading 3D model...</p>
      </div>
    </Html>
  );
}

interface CarModelViewerProps {
  glbUrl: string;
  className?: string;
}

export default function CarModelViewer({ 
  glbUrl, 
  className = "w-full h-96" 
}: CarModelViewerProps) {
  if (!glbUrl) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🚗</div>
          <p className="text-sm text-muted-foreground">
            No 3D model available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [4, 2, 6], fov: 50 }}
        className="rounded-lg"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        <Suspense fallback={<LoadingFallback />}>
          <CarModel glbUrl={glbUrl} />
        </Suspense>
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={2}
          maxDistance={20}
        />
      </Canvas>
      
      {/* Loading overlay for the entire Canvas */}
      <Suspense fallback={<Loader />}>
        <div style={{ display: "none" }} />
      </Suspense>
    </div>
  );
}

// Preload common car models
// TODO: Add actual car model URLs
useGLTF.preload("/models/tesla-model-s.glb");
useGLTF.preload("/models/porsche-911.glb"); 