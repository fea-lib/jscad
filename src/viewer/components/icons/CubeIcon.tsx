import type { IconProps } from "./types";

type Props = IconProps<{
  backEdgesStyle?: "dashed" | "dotted";
  highlight?: "back" | "bottom" | "front" | "left" | "right" | "top";
}>;

const points = {
  top: [245.5, 12],
  topLeft: [44, 125],
  topRight: [447, 132.5],
  center: [243, 241],
  bottomLeft: [41, 355],
  bottomRight: [442, 362.5],
  bottom: [243, 475],
};

const faces = {
  front: [points.center, points.bottom, points.bottomLeft, points.topLeft]
    .map((p) => p.join(","))
    .join(" "),
  back: [points.bottomRight, points.center, points.top, points.topRight]
    .map((p) => p.join(","))
    .join(" "),
  top: [points.top, points.topLeft, points.center, points.topRight]
    .map((p) => p.join(","))
    .join(" "),
  bottom: [points.bottom, points.bottomLeft, points.center, points.bottomRight]
    .map((p) => p.join(","))
    .join(" "),
  right: [points.center, points.topRight, points.bottomRight, points.bottom]
    .map((p) => p.join(","))
    .join(" "),
  left: [points.center, points.bottomLeft, points.topLeft, points.top]
    .map((p) => p.join(","))
    .join(" "),
};

const faceOpacity = 0.5;

export default function CubeIcon({
  backEdgesStyle = "dotted",
  highlight,
  size = "2rem",
  ...props
}: Props) {
  return (
    <svg
      fill="currentColor"
      height={size}
      width={size}
      {...props}
      viewBox="0 0 485.963 485.963"
    >
      <g>
        <g id="faces-back">
          <polygon
            id="face-bottom"
            opacity={highlight === "bottom" ? faceOpacity : 0}
            points={faces.bottom}
          ></polygon>
          <polygon
            id="face-left"
            opacity={highlight === "left" ? faceOpacity : 0}
            points={faces.left}
          ></polygon>
          <polygon
            id="face-back"
            opacity={highlight === "back" ? faceOpacity : 0}
            points={faces.back}
          ></polygon>
        </g>
        {backEdgesStyle === "dotted" ? (
          <g id="edges-back">
            <path
              d="M162.633,299.063c2,0,4-0.5,5.9-1.5c5.8-3.3,7.8-10.6,4.6-16.3c-3.2-5.8-10.5-7.8-16.3-4.6c-5.8,3.2-7.8,10.5-4.6,16.3
			C154.433,296.863,158.433,299.063,162.633,299.063z"
            />
            <path
              d="M122.533,321.663c2,0,4-0.5,5.9-1.5c5.8-3.2,7.8-10.6,4.6-16.3c-3.2-5.8-10.6-7.8-16.3-4.6c-5.8,3.2-7.8,10.6-4.6,16.3
			C114.233,319.463,118.333,321.663,122.533,321.663z"
            />
            <path
              d="M202.833,276.563c2,0,4-0.5,5.9-1.5c5.8-3.2,7.8-10.6,4.6-16.3c-3.2-5.8-10.6-7.8-16.3-4.6c-5.8,3.2-7.8,10.6-4.6,16.3
			C194.533,274.363,198.633,276.563,202.833,276.563z"
            />
            <path
              d="M82.433,344.163c2,0,4-0.5,5.9-1.5c5.8-3.3,7.8-10.6,4.6-16.3c-3.3-5.8-10.6-7.8-16.3-4.6c-5.8,3.2-7.8,10.6-4.6,16.3
			C74.133,341.963,78.233,344.163,82.433,344.163z"
            />
            <path
              d="M355.533,322.863c1.9,1.1,4,1.7,6.1,1.7c4.1,0,8.1-2.1,10.3-5.9c3.4-5.7,1.5-13.1-4.2-16.4c-5.7-3.4-13.1-1.5-16.5,4.2
			C347.933,312.163,349.833,319.463,355.533,322.863z"
            />
            <path
              d="M315.933,299.363c1.9,1.1,4,1.7,6.1,1.7c4.1,0,8.1-2.1,10.3-5.9c3.4-5.7,1.5-13.1-4.2-16.4c-5.7-3.4-13.1-1.5-16.4,4.2
			C308.433,288.663,310.233,295.963,315.933,299.363z"
            />
            <path
              d="M276.433,275.863c1.9,1.1,4,1.7,6.1,1.7c4.1,0,8.1-2.1,10.3-5.9c3.4-5.7,1.5-13.1-4.2-16.4c-5.7-3.4-13.1-1.5-16.4,4.2
			C268.833,265.163,270.733,272.463,276.433,275.863z"
            />
            <path
              d="M395.133,346.363c1.9,1.1,4,1.7,6.1,1.7c4.1,0,8.1-2.1,10.3-5.9c3.4-5.7,1.5-13.1-4.2-16.5s-13.1-1.5-16.4,4.2
			C387.533,335.563,389.433,342.963,395.133,346.363z"
            />
            <path
              d="M244.233,138.063c-6.6-0.1-12.1,5.2-12.1,11.9c-0.1,6.6,5.2,12.1,11.8,12.1c0,0,0.1,0,0.2,0c6.6,0,11.9-5.3,12-11.9
			C256.133,143.563,250.833,138.063,244.233,138.063z"
            />
            <path
              d="M244.733,91.963c-6.6-0.1-12.1,5.2-12.1,11.8c-0.1,6.6,5.2,12.1,11.9,12.2h0.1c6.6,0,11.9-5.3,12-11.9
			C256.733,97.563,251.433,92.063,244.733,91.963z"
            />
            <path
              d="M245.033,69.963c0,0,0.1,0,0.2,0c6.6,0,11.9-5.3,12-11.9s-5.2-12.1-11.9-12.1c-6.6-0.1-12.1,5.2-12.1,11.8
			C233.133,64.463,238.433,69.863,245.033,69.963z"
            />
            <path
              d="M243.633,184.063c-6.6-0.1-12.1,5.2-12.1,11.8c-0.1,6.6,5.2,12.1,11.9,12.2h0.1c6.6,0,11.9-5.3,12-11.9
			C255.533,189.563,250.233,184.163,243.633,184.063z"
            />
          </g>
        ) : (
          <g
            id="edges-back"
            stroke="currentColor"
            strokeWidth="15"
            strokeDasharray="20 30"
            strokeLinecap="round"
          >
            <line
              x1={points.center[0]}
              y1={points.center[1]}
              x2={points.top[0]}
              y2={points.top[1]}
            />
            <line
              x1={points.center[0]}
              y1={points.center[1]}
              x2={points.bottomRight[0]}
              y2={points.bottomRight[1]}
            />
            <line
              x1={points.center[0]}
              y1={points.center[1]}
              x2={points.bottomLeft[0]}
              y2={points.bottomLeft[1]}
            />
          </g>
        )}
        <g id="faces-front">
          <polygon
            id="face-top"
            opacity={highlight === "top" ? faceOpacity : 0}
            points={faces.top}
          ></polygon>
          <polygon
            id="face-front"
            opacity={highlight === "front" ? faceOpacity : 0}
            points={faces.front}
          ></polygon>
          <polygon
            id="face-right"
            opacity={highlight === "right" ? faceOpacity : 0}
            points={faces.right}
          ></polygon>
        </g>
        <path
          id="edges-front"
          d="M449.733,119.163l-197.9-117.5c-3.7-2.2-8.3-2.2-12-0.1l-200.6,112.6c-3.7,2.1-6.1,6-6.1,10.3l-2.8,230.1
			c-0.1,4.3,2.2,8.2,5.8,10.4l198.9,119.3c1.9,1.1,4,1.7,6.2,1.7c2,0,4-0.5,5.9-1.5l200.7-112.6c3.8-2.1,6.1-6.1,6.1-10.4l1.7-231.9
			C455.633,125.263,453.433,121.263,449.733,119.163z M230.933,453.863l-176.6-105.9l2.5-201.8l174.1,102.8V453.863z
			 M243.133,228.263l-174.6-103l177-99.4l174.4,103.5L243.133,228.263z M429.933,354.263l-175,98.2v-203.4l176.5-98.7
			L429.933,354.263z"
        ></path>
      </g>
    </svg>
  );
}
