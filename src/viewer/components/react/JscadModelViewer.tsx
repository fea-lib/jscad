import { useMemo } from "react";
import * as THREE from "three";
import DownloadIcon from "../icons/DownloadIcon";
import { jscadToThree } from "../../jscadToThree";
import type { JscadModel, Materials, Outline } from "../../types";
import { downloadModelAsStl } from "../../downloadModel";
import { ThreeModelViewer } from "./ThreeModelViewer";
import "./styles.css";

export interface Props {
  /** JSCAD geometry (single, array, or nested arrays) */
  model: JscadModel;
  name?: string;
  materials?: Materials;
  /** Optional: scene background (hex number or CSS style string) */
  background?: number | string;
  /** Optional: inline style for container div */
  style?: React.CSSProperties;
  /** Optional: class for container div */
  className?: string;
}

export function JscadModelViewer({
  model,
  name,
  className,
  style,
  materials,
  ...props
}: Props) {
  const group = useMemo<THREE.Group>(() => {
    return jscadToThree(model, materials);
  }, [model]);

  return (
    <div className={`jscad-model-viewer ${className || ""}`} style={style}>
      <ThreeModelViewer
        {...props}
        model={group}
        withActions={[
          "camera",
          <button
            key="download-stl"
            className="floating"
            onClick={() => downloadModelAsStl(model, name)}
            title="Download as STL"
          >
            <DownloadIcon />
          </button>,
        ]}
      />
    </div>
  );
}
