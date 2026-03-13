import type { CSSProperties, SVGAttributes } from "react";

export type IconProps<T extends {} = {}> = {
  className?: SVGAttributes<"svg">["className"];
  size?: CSSProperties["width" | "height"];
  style?: SVGAttributes<"svg">["style"];
} & T;
