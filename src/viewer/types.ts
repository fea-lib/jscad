import {
  Color,
  type Material as ThreeMaterial,
  type MeshStandardMaterialParameters,
  type MeshPhongMaterialParameters,
  MeshPhongMaterial,
  MeshStandardMaterial,
} from "three";
import type { RGB, RGBA } from "@jscad/modeling/src/colors";
import type { AnyGeom } from "../types";

export type JscadModel = AnyGeom | AnyGeom[];

export type Outline = RGB | RGBA | { color: RGB | RGBA; thickness: number };

export type MaterialId = `${RGB[0]}_${RGB[1]}_${RGB[2]}`;
export type Material = {
  id: MaterialId;
  color: RGB | RGBA;
  outline?: Outline;
  three:
    | (MeshStandardMaterialParameters & { threeType: "MeshStandardMaterial" })
    | (MeshPhongMaterialParameters & { threeType: "MeshPhongMaterial" });
};
export type Materials = Record<string, Material>;

export function materialId([r, g, b]: RGB | RGBA): MaterialId {
  return `${r}_${g}_${b}`;
}

export function toThree({
  three: { threeType, ...params },
}: Material): ThreeMaterial {
  switch (threeType) {
    case "MeshPhongMaterial":
      return new MeshPhongMaterial(params);
    default:
    case "MeshStandardMaterial":
      return new MeshStandardMaterial(params);
  }
}
