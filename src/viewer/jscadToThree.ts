import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { Line2 } from "three/addons/lines/Line2.js";
import type { Mat4 } from "@jscad/modeling/src/maths/types";
import type { Geom3 } from "@jscad/modeling/src/geometries/types";
import {
  materialId,
  toThree,
  type JscadModel,
  type Material,
  type MaterialId,
  type Materials,
} from "./types";

export function jscadToThree(
  model: JscadModel,
  materials: Materials = {},
): THREE.Group {
  const group = new THREE.Group();
  const geoms = flattenGeoms(model);
  const threeMaterials = Object.values(materials).reduce(
    (record: Record<MaterialId, Material>, material) => {
      record[material.id] = material;
      return record;
    },
    {},
  );

  for (const geom of geoms) {
    const color = extractColor(geom) ?? [0.8, 0.8, 0.8, 1]; // default is light gray
    const material = threeMaterials[materialId(color)];
    const outline = material?.outline;
    const mesh = convertToMesh(geom, color, material);

    if (mesh) {
      group.add(mesh);

      if (!outline) continue;

      const normalisedOutline = Array.isArray(outline)
        ? { color: outline, thickness: undefined }
        : outline;

      const outlineColor = normalisedOutline.color;
      const outlineThickness = normalisedOutline.thickness ?? 1;

      const outlineOpacity = outlineColor.length > 3 ? outlineColor[3]! : 1;

      // Add outline using Line2 (supports actual linewidth in WebGL)
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const edgePositions = edges.attributes.position.array as Float32Array;
      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions(edgePositions);
      const lines = new Line2(
        lineGeometry,
        new LineMaterial({
          color: new THREE.Color(
            outlineColor[0],
            outlineColor[1],
            outlineColor[2],
          ).getHex(),
          opacity: outlineOpacity,
          transparent: outlineOpacity < 1,
          linewidth: outlineThickness,
        }),
      );
      lines.computeLineDistances();
      lines.position.copy(mesh.position);
      lines.rotation.copy(mesh.rotation);
      lines.scale.copy(mesh.scale);
      group.add(lines);
    }
  }

  return group;
}

function flattenGeoms(model: JscadModel): Geom3[] {
  const result: Geom3[] = [];

  const recurse = (item: any) => {
    if (!item) return;

    if (Array.isArray(item)) {
      for (const sub of item) recurse(sub);
    } else if (item.polygons) {
      result.push(item);
    } else {
      console.warn("Unknown JSCAD geometry type:", item);
    }
  };

  recurse(model);
  return result;
}

function extractColor(g: any): [number, number, number, number] | undefined {
  if (g.color) return g.color;
  if (g.transforms?.color) return g.transforms.color;
  if (g._color) return g._color;
  return undefined;
}

// ----------
// SINGLE GEOMETRY -> MESH
// ----------

function convertToMesh(
  model: Geom3,
  color: [number, number, number, number],
  material?: Material,
): THREE.Mesh | null {
  if (model.polygons.length === 0) return null;

  const positions: number[] = [];
  const normals: number[] = [];

  for (const poly of model.polygons) {
    const verts = poly.vertices;

    // fan triangulation (JSCAD polygons may be >3 vertices)
    for (let i = 1; i < verts.length - 1; i++) {
      const a = verts[0];
      const b = verts[i];
      const c = verts[i + 1];

      positions.push(...a, ...b, ...c);

      const vA = new THREE.Vector3(...a);
      const vB = new THREE.Vector3(...b);
      const vC = new THREE.Vector3(...c);

      const normal = new THREE.Vector3()
        .subVectors(vB, vA)
        .cross(new THREE.Vector3().subVectors(vC, vA))
        .normalize();

      normals.push(
        ...normal.toArray(),
        ...normal.toArray(),
        ...normal.toArray(),
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingSphere();

  const m = material
    ? toThree(material)
    : new THREE.MeshStandardMaterial({
        color: new THREE.Color(color[0], color[1], color[2]),
        metalness: 0.1,
        roughness: 0.5,
      });

  if (color[3] < 1) {
    m.transparent = true;
    m.opacity = color[3];
  }

  const mesh = new THREE.Mesh(geometry, m);

  // Apply JSCAD transform matrix if present
  if (model.transforms && Array.isArray(model.transforms)) {
    const m = new THREE.Matrix4();
    m.fromArray(model.transforms as Mat4);
    mesh.applyMatrix4(m);
  }

  return mesh;
}
