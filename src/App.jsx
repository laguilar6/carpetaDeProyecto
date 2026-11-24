import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PointerLockControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

// 1. Componente que carga y muestra tu modelo
function Escenario() {
  const { scene } = useGLTF('/escenarioLF.glb');
  useEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
  }, [scene]);
  return <primitive object={scene} />;
}

// 2. Componente que maneja el movimiento con WASD y los límites
function MovimientoConTeclado() {
  const { camera } = useThree();
  const controlsRef = useRef();
  
  const teclas = useRef({
    adelante: false,
    atras: false,
    izquierda: false,
    derecha: false,
  });

  const limites = {
    minX: -8,
    maxX: 2,
    minZ: -100,
    maxZ: -40,
    alturaY: 2
  };

  useEffect(() => {
    const alPresionar = (event) => {
      switch (event.code) {
        case 'KeyW': teclas.current.adelante = true; break;
        case 'KeyS': teclas.current.atras = true; break;
        case 'KeyA': teclas.current.izquierda = true; break;
        case 'KeyD': teclas.current.derecha = true; break;
        default: break;
      }
    };
    const alSoltar = (event) => {
      switch (event.code) {
        case 'KeyW': teclas.current.adelante = false; break;
        case 'KeyS': teclas.current.atras = false; break;
        case 'KeyA': teclas.current.izquierda = false; break;
        case 'KeyD': teclas.current.derecha = false; break;
        default: break;
      }
    };

    window.addEventListener('keydown', alPresionar);
    window.addEventListener('keyup', alSoltar);
    return () => {
      window.removeEventListener('keydown', alPresionar);
      window.removeEventListener('keyup', alSoltar);
    };
  }, []);

  useFrame(() => {
    if (!controlsRef.current || !controlsRef.current.isLocked) return;

    const velocidad = 0.1;
    const direccion = new THREE.Vector3();

    if (teclas.current.adelante) direccion.z -= 1;
    if (teclas.current.atras) direccion.z += 1;
    if (teclas.current.izquierda) direccion.x -= 1;
    if (teclas.current.derecha) direccion.x += 1;

    direccion.normalize();
    direccion.applyEuler(camera.rotation);
    camera.position.addScaledVector(direccion, velocidad);

    camera.position.x = Math.max(limites.minX, Math.min(limites.maxX, camera.position.x));
    camera.position.z = Math.max(limites.minZ, Math.min(limites.maxZ, camera.position.z));
    camera.position.y = limites.alturaY; 
  });

  return <PointerLockControls ref={controlsRef} />;
}

// 3. Componente de Luces para mantener el código de App limpio
function Iluminacion() {
  return (
    <>
      {/* Luz ambiental base (bajita para que no pierda oscuridad) */}
      <ambientLight intensity={0.15} />
      
      {/* Luz hemisférica: simula el rebote del cielo oscuro y el suelo */}
      {/* skyColor: color del "cielo" / groundColor: color del suelo */}
      <hemisphereLight 
        skyColor="#1a1a3a" 
        groundColor="#2a1a1a" 
        intensity={0.4} 
      />

      {/* Luz direccional suave para dar volumen a los edificios */}
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#aaccff" />

      {/* SpotLight simulando una farola principal */}
      {/* position: dónde está la luz. target: a dónde apunta (por defecto al 0,0,0) */}
      <spotLight 
        position={[2, 8, -50]} 
        angle={0.6} 
        penumbra={1} 
        intensity={2} 
        color="#ffdd99" 
        distance={30}
        decay={2}
      />
      
      {/* Segunda SpotLight en otro punto de la calle para crear más ambiente */}
      <spotLight 
        position={[-5, 7, -80]} 
        angle={0.5} 
        penumbra={0.8} 
        intensity={1.5} 
        color="#99ddff" 
        distance={25}
        decay={2}
      />
    </>
  );
}

// 4. Componente principal de la App
function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [-2.5, 2, -62], fov: 75 }}
        onCreated={({ scene }) => {
          // Fondo oscuro
          scene.background = new THREE.Color('#0a0a1a');
          // Niebla exponencial (más densa = 0.035)
          scene.fog = new THREE.FogExp2('#0a0a1a', 0.035); 
        }}
      >
        <Iluminacion />
        <Escenario />
        <MovimientoConTeclado />

        {/* Post-procesado: Bloom para el brillo de las luces */}
        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.3} 
            luminanceSmoothing={0.1} 
            intensity={0.8} 
            mipmapBlur 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default App;