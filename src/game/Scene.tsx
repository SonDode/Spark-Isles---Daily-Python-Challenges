import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { Environment, Html, Lightformer, Sky, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { ISLANDS } from "./sim/content";
import { bridgeFootprint, islandCenter, nearestVillager, SPAWN, step, villagerPos, type Vec2 } from "./sim/world";
import { makeTextures, type Textures } from "./textures";

export interface Input { x: number; z: number }

const CAM_OFFSET = new THREE.Vector3(0, 11, 13);
const N = ISLANDS.length;

type BiomeKey = "plains" | "desert" | "snow" | "mushroom" | "nether" | "end";
const BIOMES: BiomeKey[] = ["plains", "desert", "snow", "mushroom", "nether", "end"];

function biomeMats(b: BiomeKey, tex: Textures) {
  const m = (t: THREE.Texture, glow?: string) => new THREE.MeshStandardMaterial(glow ? { map: t, emissive: glow, emissiveIntensity: 0.25 } : { map: t });
  const cube = (side: THREE.Texture, top: THREE.Texture, bottom: THREE.Texture) => { const s = m(side); return [s, s, m(top), m(bottom), s, s]; };
  switch (b) {
    case "plains": return { top: cube(tex.grassSide, tex.grassTop, tex.dirt), earth: m(tex.stone) };
    case "desert": return { top: cube(tex.sand, tex.sand, tex.sandstone), earth: m(tex.sandstone) };
    case "snow": return { top: cube(tex.snowSide, tex.snowTop, tex.dirt), earth: m(tex.stone) };
    case "mushroom": return { top: cube(tex.myceliumSide, tex.myceliumTop, tex.dirt), earth: m(tex.stone) };
    case "nether": return { top: cube(tex.crimsonSide, tex.crimsonTop, tex.netherrack), earth: m(tex.netherrack, "#300808") };
    case "end": return { top: cube(tex.endstone, tex.endstone, tex.endstone), earth: m(tex.endstone) };
  }
}

function Island({ i, tex }: { i: number; tex: Textures }) {
  const topRef = useRef<THREE.InstancedMesh>(null);
  const earthRef = useRef<THREE.InstancedMesh>(null);
  const { top, earth } = useMemo(() => {
    const c = islandCenter(i);
    const top: [number, number, number][] = [];
    const earth: [number, number, number][] = [];
    for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) top.push([c.x + x, -0.5, c.z + z]);
    for (let d = 1; d <= 3; d++) {
      const r = 4 - d;
      for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) earth.push([c.x + x, -0.5 - d, c.z + z]);
    }
    return { top, earth };
  }, [i]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    top.forEach((p, k) => topRef.current!.setMatrixAt(k, m.makeTranslation(...p)));
    earth.forEach((p, k) => earthRef.current!.setMatrixAt(k, m.makeTranslation(...p)));
    topRef.current!.instanceMatrix.needsUpdate = true;
    earthRef.current!.instanceMatrix.needsUpdate = true;
  }, [top, earth]);
  const mats = useMemo(() => biomeMats(BIOMES[i % BIOMES.length]!, tex), [i, tex]);
  return (
    <>
      <instancedMesh ref={topRef} args={[undefined, mats.top, top.length]} castShadow receiveShadow>
        <boxGeometry />
      </instancedMesh>
      <instancedMesh ref={earthRef} args={[undefined, mats.earth, earth.length]}>
        <boxGeometry />
      </instancedMesh>
    </>
  );
}

function Block({ p, s = [1, 1, 1], map, glow }: { p: [number, number, number]; s?: [number, number, number]; map: THREE.Texture; glow?: string }) {
  return (
    <mesh position={p} castShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial map={map} {...(glow ? { emissive: glow, emissiveIntensity: 0.6 } : {})} />
    </mesh>
  );
}

type P3 = [number, number, number];
function Tinted({ p, s = [1, 1, 1], color, glow, opacity }: { p: P3; s?: P3; color: string; glow?: number; opacity?: number }) {
  return (
    <mesh position={p} castShadow={!opacity}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={color} {...(glow ? { emissive: color, emissiveIntensity: glow } : {})} {...(opacity ? { transparent: true, opacity } : {})} />
    </mesh>
  );
}

const FLOWERS = ["#e8423a", "#f2d23a", "#f5f5f5", "#6a8ef0", "#e070c0"];

function Decor({ i, tex }: { i: number; tex: Textures }) {
  const c = islandCenter(i);
  const b = BIOMES[i % BIOMES.length]!;
  const at = (x: number, z: number, node: React.ReactNode, k: string) => <group key={k} position={[c.x + x, 0, c.z + z]}>{node}</group>;
  const scatter: [number, number][] = [[-1.2, 3.4], [-2.4, 1.2], [0.4, 2.6], [-3.6, -0.6], [2.2, 0.6], [-0.8, -3.6], [1.2, 3.6], [-3.4, 3.6]];
  const out: React.ReactNode[] = [];
  switch (b) {
    case "plains":
      scatter.forEach(([x, z], k) => out.push(at(x, z, <><Tinted p={[0, 0.2, 0]} s={[0.08, 0.4, 0.08]} color="#3f8f2a" /><Tinted p={[0, 0.45, 0]} s={[0.22, 0.18, 0.22]} color={FLOWERS[k % 5]!} /></>, `f${k}`)));
      out.push(at(-3, 3, <><Tinted p={[0, 0.4, 0]} s={[0.8, 0.8, 0.8]} color="#e08a1e" /><Tinted p={[0, 0.88, 0]} s={[0.15, 0.2, 0.15]} color="#4a6a20" /></>, "pumpkin"));
      out.push(at(0.5, 3.2, <><Block p={[0, 0.5, 0]} s={[1, 1, 1]} map={tex.planks} /><Tinted p={[0, 1.05, 0]} s={[1, 0.1, 1]} color="#c8a050" /></>, "table"));
      out.push(at(-1.5, -3.5, <Block p={[0, 0.3, 0]} s={[2.6, 0.6, 0.6]} map={tex.log} />, "log"));
      break;
    case "desert":
      out.push(at(-2.5, 2.5, <><Block p={[0, 0.5, 0]} s={[2, 1, 2]} map={tex.sandstone} /><Block p={[-0.8, 1.6, -0.8]} s={[0.3, 1.2, 0.3]} map={tex.sandstone} /><Block p={[0.8, 1.6, 0.8]} s={[0.3, 1.2, 0.3]} map={tex.sandstone} /><Block p={[0.8, 1.6, -0.8]} s={[0.3, 1.2, 0.3]} map={tex.sandstone} /><Block p={[-0.8, 1.6, 0.8]} s={[0.3, 1.2, 0.3]} map={tex.sandstone} /><Block p={[0, 2.3, 0]} s={[2, 0.3, 2]} map={tex.sandstone} /></>, "well"));
      out.push(at(0.8, 3.2, <><Block p={[0, 0.3, 0]} s={[1.8, 0.6, 1.2]} map={tex.sandstone} /><Block p={[0, 0.8, 0]} s={[1.1, 0.4, 0.8]} map={tex.sandstone} /></>, "ruin"));
      [[-3.5, -0.5], [2.3, 0.8], [-0.6, -3.6]].forEach(([x, z], k) => out.push(at(x!, z!, <><Tinted p={[0, 0.25, 0]} s={[0.05, 0.5, 0.4]} color="#8a6a3a" /><Tinted p={[0, 0.25, 0]} s={[0.4, 0.5, 0.05]} color="#8a6a3a" /></>, `bush${k}`)));
      break;
    case "snow":
      out.push(at(-2.6, 2.6, <><Block p={[0, 0.45, 0]} s={[0.9, 0.9, 0.9]} map={tex.snowTop} /><Block p={[0, 1.2, 0]} s={[0.7, 0.7, 0.7]} map={tex.snowTop} /><Tinted p={[0, 1.85, 0]} s={[0.6, 0.6, 0.6]} color="#e08a1e" /><Tinted p={[-0.5, 1.2, 0]} s={[0.4, 0.06, 0.06]} color="#5a3a1e" /><Tinted p={[0.5, 1.2, 0]} s={[0.4, 0.06, 0.06]} color="#5a3a1e" /></>, "snowman"));
      out.push(at(0.8, 3, <><Tinted p={[0, 0.5, 0]} color="#a8d8f8" opacity={0.7} /><Tinted p={[0.9, 0.35, 0.3]} s={[0.7, 0.7, 0.7]} color="#a8d8f8" opacity={0.7} /></>, "ice"));
      out.push(at(-3.4, -0.4, <Block p={[0, 0.25, 0]} s={[0.9, 0.5, 0.9]} map={tex.snowTop} />, "drift"));
      break;
    case "mushroom":
      scatter.forEach(([x, z], k) => out.push(at(x, z, <><Tinted p={[0, 0.15, 0]} s={[0.1, 0.3, 0.1]} color="#efe6d0" /><Tinted p={[0, 0.34, 0]} s={[0.35, 0.12, 0.35]} color={k % 2 ? "#c0302a" : "#9a6a40"} /></>, `m${k}`)));
      out.push(at(-2.6, 2.6, <Block p={[0, 0.5, 0]} map={tex.mushroomCap} />, "capblock"));
      break;
    case "nether":
      out.push(at(-2.5, 2.6, <><Block p={[0, 0, 0]} s={[2.4, 0.1, 1.8]} map={tex.netherrack} /><Tinted p={[0, 0.06, 0]} s={[2, 0.05, 1.4]} color="#ff7a10" glow={1.4} /><pointLight position={[0, 0.8, 0]} color="#ff6a10" intensity={5} distance={6} /></>, "lava"));
      out.push(at(0.6, 3.4, <><Block p={[-1, 1.5, 0]} s={[0.5, 3, 0.5]} map={tex.obsidian} /><Block p={[1, 1.5, 0]} s={[0.5, 3, 0.5]} map={tex.obsidian} /><Block p={[0, 3.25, 0]} s={[2.5, 0.5, 0.5]} map={tex.obsidian} /><Block p={[0, 0.25, 0]} s={[2.5, 0.5, 0.5]} map={tex.obsidian} /><Tinted p={[0, 1.75, 0]} s={[1.5, 2.5, 0.12]} color="#9a40ff" glow={1.2} opacity={0.75} /><pointLight position={[0, 1.8, 0.6]} color="#a050ff" intensity={4} distance={6} /></>, "portal"));
      out.push(at(-3.5, -0.5, <><Block p={[0, 0.5, 0]} map={tex.netherrack} /><Tinted p={[0, 1.2, 0]} s={[0.4, 0.4, 0.4]} color="#ffb030" glow={2} /></>, "fire"));
      break;
    case "end":
      out.push(at(-2.5, 2.4, <><Tinted p={[0, 0.4, 0]} s={[0.9, 0.8, 0.9]} color="#9a6aa8" /><Tinted p={[0, 0.85, 0]} s={[0.95, 0.15, 0.95]} color="#b080c0" /></>, "shulker"));
      out.push(at(0.8, 3.2, <><Block p={[0, 0.15, 0]} s={[1, 0.3, 1]} map={tex.obsidian} /><mesh position={[0, 1, 0]} rotation={[0.7, 0.7, 0]}><boxGeometry args={[0.6, 0.6, 0.6]} /><meshStandardMaterial color="#ff90e0" emissive="#ff50c0" emissiveIntensity={1.5} transparent opacity={0.85} /></mesh></>, "crystal"));
      [[-3.5, -0.5], [-0.6, -3.6]].forEach(([x, z], k) => out.push(at(x!, z!, <Block p={[0, 0.5 + k * 0.5, 0]} s={[0.8, 1 + k, 0.8]} map={tex.obsidian} />, `ob${k}`)));
      out.push(<Sparkles key="sp" position={[c.x, 2.5, c.z]} count={40} scale={[9, 4, 9]} size={3} color="#d090ff" speed={0.3} />);
      break;
  }
  if (b === "nether") out.push(<Sparkles key="ash" position={[c.x, 2.5, c.z]} count={40} scale={[9, 4, 9]} size={2.5} color="#ff9040" speed={0.4} />);
  return <>{out}</>;
}

function Tree({ x, z, tex, biome, k }: { x: number; z: number; tex: Textures; biome: BiomeKey; k: number }) {
  let body: React.ReactNode;
  switch (biome) {
    case "plains":
      body = <><Block p={[0, 1.5, 0]} s={[1, 3, 1]} map={tex.log} /><Block p={[0, 3.5, 0]} s={[3, 2, 3]} map={tex.leaves} /><Block p={[0, 4.75, 0]} s={[1.5, 0.5, 1.5]} map={tex.leaves} /></>;
      break;
    case "desert":
      body = <><Block p={[0, 1 + k * 0.5, 0]} s={[0.8, 2 + k, 0.8]} map={tex.cactus} />{k === 1 && <Block p={[0.7, 1.8, 0]} s={[0.6, 0.6, 0.6]} map={tex.cactus} />}<Block p={[1.6, 0.3, 1]} s={[0.6, 0.6, 0.6]} map={tex.sandstone} /></>;
      break;
    case "snow":
      body = <><Block p={[0, 1.5, 0]} s={[0.8, 3, 0.8]} map={tex.log} /><Block p={[0, 2.2, 0]} s={[3, 0.8, 3]} map={tex.spruce} /><Block p={[0, 3.2, 0]} s={[2.2, 0.8, 2.2]} map={tex.spruce} /><Block p={[0, 4.1, 0]} s={[1.4, 0.8, 1.4]} map={tex.spruce} /><Block p={[0, 4.6, 0]} s={[1.4, 0.2, 1.4]} map={tex.snowTop} /></>;
      break;
    case "mushroom":
      body = k === 0
        ? <><Block p={[0, 1.5, 0]} s={[0.9, 3, 0.9]} map={tex.mushroomStem} /><Block p={[0, 3.3, 0]} s={[3.4, 0.8, 3.4]} map={tex.mushroomCap} /><Block p={[0, 3.9, 0]} s={[2, 0.5, 2]} map={tex.mushroomCap} /></>
        : <><Block p={[0, 1, 0]} s={[0.7, 2, 0.7]} map={tex.mushroomStem} /><Block p={[0, 2.2, 0]} s={[2.2, 0.5, 2.2]} map={tex.mushroomStem} /></>;
      break;
    case "nether":
      body = k === 0
        ? <><Block p={[0, 1.5, 0]} s={[0.9, 3, 0.9]} map={tex.crimsonStem} /><Block p={[0, 3.4, 0]} s={[2.8, 1.4, 2.8]} map={tex.wart} /><Block p={[1, 2.5, 1]} s={[0.6, 0.6, 0.6]} map={tex.glowstone} glow="#ffb040" /><pointLight position={[1, 2.5, 1]} color="#ffa040" intensity={4} distance={7} /></>
        : <><Block p={[0, 0.5, 0]} map={tex.glowstone} glow="#ffb040" /><Block p={[1.2, 0.05, 0.6]} s={[1.6, 0.1, 1.2]} map={tex.glowstone} glow="#ff6010" /><pointLight position={[0, 1.5, 0]} color="#ff8030" intensity={5} distance={7} /></>;
      break;
    case "end":
      body = k === 0
        ? <><Block p={[0, 2.5, 0]} s={[1.6, 5, 1.6]} map={tex.obsidian} /><mesh position={[0, 5.6, 0]} rotation={[0.6, 0.6, 0]}><boxGeometry args={[0.7, 0.7, 0.7]} /><meshStandardMaterial color="#f0b0ff" emissive="#c050ff" emissiveIntensity={1.2} /></mesh><pointLight position={[0, 5.6, 0]} color="#d080ff" intensity={6} distance={9} /></>
        : <><Block p={[0, 1, 0]} s={[0.6, 2, 0.6]} map={tex.chorus} /><Block p={[0.5, 1.8, 0]} s={[0.5, 0.5, 0.5]} map={tex.chorus} /><Block p={[0, 2.3, 0]} s={[0.7, 0.7, 0.7]} map={tex.chorus} glow="#b080c0" /></>;
      break;
  }
  return <group position={[x, 0, z]}>{body}</group>;
}

function Bridge({ i, tex }: { i: number; tex: Textures }) {
  const geometry = useMemo(() => {
    const [first, ...rest] = bridgeFootprint(i);
    const shape = new THREE.Shape();
    shape.moveTo(first.x, first.z);
    rest.forEach((p) => shape.lineTo(p.x, p.z));
    shape.closePath();
    const result = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
    result.rotateX(Math.PI / 2);
    return result;
  }, [i]);
  const map = useMemo(() => {
    const t = tex.planks.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.5, 0.5);
    t.needsUpdate = true;
    return t;
  }, [tex]);
  useEffect(() => () => { geometry.dispose(); map.dispose(); }, [geometry, map]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial map={map} />
    </mesh>
  );
}

type MobKind = "creeper" | "husk" | "polar" | "mooshroom" | "piglin" | "enderman";
const MOBS: MobKind[] = ["creeper", "husk", "polar", "mooshroom", "piglin", "enderman"];

function MobBody({ kind, head }: { kind: MobKind; head: React.RefObject<THREE.Group | null> }) {
  const B = (p: P3, s: P3, color: string, glow?: number) => <Tinted p={p} s={s} color={color} {...(glow ? { glow } : {})} />;
  const eyes = (y: number, z: number, color: string, glow?: number, gap = 0.14) => <>{B([-gap, y, z], [0.12, 0.1, 0.02], color, glow)}{B([gap, y, z], [0.12, 0.1, 0.02], color, glow)}</>;
  switch (kind) {
    case "creeper":
      return <>
        {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], k) => <group key={k}>{B([x!, 0.2, z!], [0.3, 0.4, 0.3], "#4f9a3a")}</group>)}
        {B([0, 0.9, 0], [0.5, 1, 0.3], "#5cae44")}
        <group ref={head} position={[0, 1.65, 0]}>
          {B([0, 0, 0], [0.6, 0.6, 0.6], "#62b84a")}
          {B([-0.13, 0.08, 0.305], [0.14, 0.14, 0.02], "#111")}{B([0.13, 0.08, 0.305], [0.14, 0.14, 0.02], "#111")}
          {B([0, -0.08, 0.305], [0.12, 0.14, 0.02], "#111")}{B([-0.09, -0.16, 0.305], [0.08, 0.14, 0.02], "#111")}{B([0.09, -0.16, 0.305], [0.08, 0.14, 0.02], "#111")}
        </group>
      </>;
    case "husk":
      return <>
        {B([-0.15, 0.375, 0], [0.28, 0.75, 0.28], "#6a5a3a")}{B([0.15, 0.375, 0], [0.28, 0.75, 0.28], "#6a5a3a")}
        {B([0, 1.12, 0], [0.6, 0.75, 0.32], "#8a7a4a")}
        {B([-0.42, 1.4, 0.3], [0.22, 0.22, 0.75], "#a89668")}{B([0.42, 1.4, 0.3], [0.22, 0.22, 0.75], "#a89668")}
        <group ref={head} position={[0, 1.8, 0]}>{B([0, 0, 0], [0.58, 0.58, 0.58], "#a89668")}{eyes(0.02, 0.295, "#2a2014")}</group>
      </>;
    case "polar":
      return <>
        {[[-0.3, -0.45], [0.3, -0.45], [-0.3, 0.45], [0.3, 0.45]].map(([x, z], k) => <group key={k}>{B([x!, 0.3, z!], [0.36, 0.6, 0.36], "#e8eef0")}</group>)}
        {B([0, 0.9, 0], [0.95, 0.75, 1.5], "#f2f6f8")}
        <group ref={head} position={[0, 1.15, 0.9]}>
          {B([0, 0, 0], [0.6, 0.55, 0.5], "#f2f6f8")}{B([0, -0.1, 0.32], [0.32, 0.22, 0.2], "#e0e6e8")}{B([0, -0.03, 0.43], [0.14, 0.08, 0.02], "#222")}
          {eyes(0.1, 0.255, "#222", undefined, 0.17)}{B([-0.22, 0.32, 0], [0.14, 0.12, 0.08], "#e0e6e8")}{B([0.22, 0.32, 0], [0.14, 0.12, 0.08], "#e0e6e8")}
        </group>
      </>;
    case "mooshroom":
      return <>
        {[[-0.25, -0.4], [0.25, -0.4], [-0.25, 0.4], [0.25, 0.4]].map(([x, z], k) => <group key={k}>{B([x!, 0.3, z!], [0.24, 0.6, 0.24], "#7a2420")}</group>)}
        {B([0, 0.95, 0], [0.8, 0.7, 1.3], "#b8302a")}{B([0.2, 1.31, 0.2], [0.35, 0.02, 0.5], "#efe6d0")}
        {B([-0.15, 1.45, -0.2], [0.08, 0.25, 0.08], "#efe6d0")}{B([-0.15, 1.6, -0.2], [0.3, 0.12, 0.3], "#c0302a")}
        <group ref={head} position={[0, 1.15, 0.8]}>
          {B([0, 0, 0], [0.6, 0.55, 0.4], "#b8302a")}{B([0, -0.15, 0.22], [0.4, 0.2, 0.06], "#efe6d0")}{eyes(0.08, 0.205, "#111", undefined, 0.18)}
          {B([-0.35, 0.25, 0], [0.12, 0.12, 0.08], "#ddd")}{B([0.35, 0.25, 0], [0.12, 0.12, 0.08], "#ddd")}
        </group>
      </>;
    case "piglin":
      return <>
        {B([-0.15, 0.375, 0], [0.28, 0.75, 0.28], "#5a3a20")}{B([0.15, 0.375, 0], [0.28, 0.75, 0.28], "#5a3a20")}
        {B([0, 1.12, 0], [0.6, 0.75, 0.32], "#8a5a30")}{B([0, 0.85, 0.17], [0.62, 0.12, 0.02], "#e8b83a")}
        {B([-0.42, 1.12, 0], [0.22, 0.75, 0.22], "#e8a090")}{B([0.42, 1.12, 0], [0.22, 0.75, 0.22], "#e8a090")}
        {B([0.42, 0.75, 0.3], [0.08, 0.08, 0.7], "#e8c040", 0.3)}
        <group ref={head} position={[0, 1.8, 0]}>
          {B([0, 0, 0], [0.7, 0.6, 0.55], "#e8a090")}{B([0, -0.08, 0.32], [0.32, 0.22, 0.1], "#d88878")}
          {B([-0.08, -0.08, 0.375], [0.06, 0.08, 0.02], "#5a2a20")}{B([0.08, -0.08, 0.375], [0.06, 0.08, 0.02], "#5a2a20")}
          {eyes(0.12, 0.28, "#fff", undefined, 0.2)}{B([-0.38, 0.05, 0], [0.08, 0.3, 0.2], "#d88878")}{B([0.38, 0.05, 0], [0.08, 0.3, 0.2], "#d88878")}
        </group>
      </>;
    case "enderman":
      return <>
        {B([-0.12, 0.9, 0], [0.12, 1.8, 0.12], "#111")}{B([0.12, 0.9, 0], [0.12, 1.8, 0.12], "#111")}
        {B([0, 2.3, 0], [0.5, 1, 0.3], "#161616")}
        {B([-0.34, 1.85, 0], [0.1, 1.7, 0.1], "#111")}{B([0.34, 1.85, 0], [0.1, 1.7, 0.1], "#111")}
        <group ref={head} position={[0, 3.05, 0]}>{B([0, 0, 0], [0.5, 0.5, 0.5], "#111")}{eyes(0, 0.26, "#e070ff", 3, 0.12)}</group>
      </>;
  }
}

function Villager({ i, state, hideBadge }: { i: number; state: "locked" | "open" | "done"; hideBadge?: boolean }) {
  const p = villagerPos(i);
  const head = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const kind = MOBS[i % MOBS.length]!;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (head.current) head.current.rotation.y = Math.sin(t * 0.8 + i) * 0.5;
    if (body.current) body.current.position.y = Math.abs(Math.sin(t * 2 + i)) * 0.04;
  });
  const badge = state === "done" ? "✓" : state === "open" ? "!" : "🔒";
  const top = kind === "enderman" ? 3.8 : kind === "polar" || kind === "mooshroom" ? 2.2 : 2.6;
  return (
    <group position={[p.x, 0, p.z]}>
      <group ref={body}><MobBody kind={kind} head={head} /></group>
      {/* The overlay stays mounted so unmounting it mid-dialog cannot break the canvas;
          only its contents are hidden while a dialog or the sign-in panel is open. */}
      <Html position={[0, top, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
        {!hideBadge && (
          <div className="pointer-events-none flex flex-col items-center gap-1 whitespace-nowrap">
            <span className={`font-pixel text-2xl ${state === "done" ? "text-game-success" : state === "open" ? "text-game-accent animate-bounce" : "text-game-ink-dim"}`}>{badge}</span>
          </div>
        )}
      </Html>
    </group>
  );
}

function Beacon({ i, tex }: { i: number; tex: Textures }) {
  const c = islandCenter(i);
  const beam = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (beam.current) (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(clock.elapsedTime * 2) * 0.1;
  });
  return (
    <group position={[c.x + 3, 0, c.z + 3]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry />
        <meshStandardMaterial map={tex.gold} emissive="#a07000" emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={beam} position={[0, 8, 0]}>
        <boxGeometry args={[0.5, 15, 0.5]} />
        <meshBasicMaterial color="#ffe27a" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 2, 0]} color="#ffd34d" intensity={6} distance={8} />
    </group>
  );
}

function Clouds() {
  const g = useRef<THREE.Group>(null);
  const clouds = useMemo(() => Array.from({ length: 7 }, (_, k) => ({ x: k * 14 - 15, y: 14 + (k % 3) * 2, z: -24 + ((k * 37) % 30), w: 1.5 + (k % 3) * 0.5 })), []);
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.children.forEach((c) => { c.position.x += Math.min(dt, 0.05) * 0.6; if (c.position.x > 90) c.position.x = -25; });
  });
  return (
    <group ref={g}>
      {clouds.map((c, k) => (
        <mesh key={k} position={[c.x, c.y, c.z]}>
          <boxGeometry args={[c.w, 0.4, c.w * 0.6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Player({ input, paused, completed, onNear, posRef, attract }: {
  attract?: boolean;
  input: React.RefObject<Input>; paused: boolean; completed: Set<number>;
  onNear: (i: number | null) => void; posRef: React.RefObject<Vec2>;
}) {
  const g = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null), legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null), armR = useRef<THREE.Mesh>(null);
  const near = useRef<number | null>(null);
  const walkT = useRef(0);
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const dir = paused ? { x: 0, z: 0 } : input.current!;
    const prev = posRef.current!;
    const next = step(prev, dir, dt, completed, N);
    posRef.current = next;
    const moving = next.x !== prev.x || next.z !== prev.z;
    if (g.current) {
      g.current.position.set(next.x, 0, next.z);
      if (moving) {
        const want = Math.atan2(next.x - prev.x, next.z - prev.z);
        let d = want - g.current.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        g.current.rotation.y += d * (1 - Math.exp(-14 * dt));
      }
    }
    walkT.current = moving ? walkT.current + dt * 10 : walkT.current * Math.exp(-10 * dt);
    const swing = Math.sin(walkT.current) * (moving ? 0.7 : 0);
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing;
    if (armR.current) armR.current.rotation.x = swing;
    target.set(next.x, 0.8, next.z);
    if (attract) {
      const t = performance.now() / 1000 * 0.08;
      const mid = new THREE.Vector3(islandCenter(Math.floor(N / 2)).x, 0, islandCenter(Math.floor(N / 2)).z);
      camera.position.lerp(new THREE.Vector3(mid.x + Math.sin(t) * 38, 18, mid.z + Math.cos(t) * 38), 1 - Math.exp(-2 * dt));
      camera.lookAt(mid);
    } else {
      camera.position.lerp(target.clone().add(CAM_OFFSET), 1 - Math.exp(-5 * dt));
      camera.lookAt(target);
    }
    const n = nearestVillager(next, N);
    if (n !== near.current) { near.current = n; onNear(n); }
  });

  return (
    <group ref={g} position={[SPAWN.x, 0, SPAWN.z]}>
      <mesh ref={legL} position={[-0.16, 0.375, 0]} castShadow>
        <boxGeometry args={[0.3, 0.75, 0.3]} />
        <meshStandardMaterial color="#2c3e8f" />
      </mesh>
      <mesh ref={legR} position={[0.16, 0.375, 0]} castShadow>
        <boxGeometry args={[0.3, 0.75, 0.3]} />
        <meshStandardMaterial color="#2c3e8f" />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.65, 0.75, 0.35]} />
        <meshStandardMaterial color="#e0702f" />
      </mesh>
      <mesh ref={armL} position={[-0.45, 1.45, 0]} castShadow>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color="#e0702f" />
      </mesh>
      <mesh ref={armR} position={[0.45, 1.45, 0]} castShadow>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color="#e0702f" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#d9a57a" />
      </mesh>
      <mesh position={[0, 2.1, -0.02]} castShadow>
        <boxGeometry args={[0.64, 0.15, 0.64]} />
        <meshStandardMaterial color="#4a2f1b" />
      </mesh>
      <mesh position={[-0.13, 1.88, 0.31]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshBasicMaterial color="#1d2a6b" /></mesh>
      <mesh position={[0.13, 1.88, 0.31]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshBasicMaterial color="#1d2a6b" /></mesh>
    </group>
  );
}

function ReadySignal() {
  const done = useRef(false);
  const { gl } = useThree();
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    gl.domElement.parentElement?.parentElement?.setAttribute("data-scene-ready", "true");
  });
  return null;
}

export function Scene({ input, paused, completed, onNear, posRef, attract, hideBadges }: {
  attract?: boolean;
  input: React.RefObject<Input>; paused: boolean; completed: Set<number>;
  onNear: (i: number | null) => void; posRef: React.RefObject<Vec2>;
  hideBadges?: boolean;
}) {
  const tex = useMemo(() => makeTextures(), []);
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);
  return (
    <>
      <color attach="background" args={["#8ec9f2"]} />
      <Sky distance={450} sunPosition={[20, 30, 15]} turbidity={3} rayleigh={0.6} mieCoefficient={0.004} />
      <Environment resolution={64}>
        <Lightformer intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer intensity={0.8} color="#ffd9a8" position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
      </Environment>
      <fog attach="fog" args={["#a9d6f5", 25, 70]} />
      <hemisphereLight args={["#dff1ff", "#6b5a3a", 0.7]} />
      <directionalLight position={[20, 30, 15]} intensity={2.4} color="#fff2dc" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={30} shadow-camera-bottom={-30} />
      {ISLANDS.map((isl) => <Island key={`isl-${isl.id}`} i={isl.id} tex={tex} />)}
      {ISLANDS.map((isl) => {
        const c = islandCenter(isl.id);
        const state = completed.has(isl.id) ? "done" : isl.id === 0 || completed.has(isl.id - 1) ? "open" : "locked";
        return (
          <group key={isl.id}>
            <Tree x={c.x - 3} z={c.z - 2.5} tex={tex} biome={BIOMES[isl.id % BIOMES.length]!} k={0} />
            <Tree x={c.x + 3.3} z={c.z - 3.5} tex={tex} biome={BIOMES[isl.id % BIOMES.length]!} k={1} />
            <Decor i={isl.id} tex={tex} />
            <Villager i={isl.id} state={state} hideBadge={!!hideBadges} />
            {completed.has(isl.id) && <Beacon i={isl.id} tex={tex} />}
            {isl.id < N - 1 && completed.has(isl.id) && <Bridge i={isl.id} tex={tex} />}
          </group>
        );
      })}
      <Clouds />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[35, -14, -3]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#3f86c9" roughness={0.15} metalness={0.2} />
      </mesh>
      <Player input={input} paused={paused} completed={completed} onNear={onNear} posRef={posRef} attract={attract ?? false} />
      <EffectComposer multisampling={0}>
        <SMAA />
        <Bloom intensity={0.6} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.3} darkness={0.45} />
      </EffectComposer>
      <ReadySignal />
    </>
  );
}
