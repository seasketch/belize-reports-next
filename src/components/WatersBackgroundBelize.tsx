import React from "react";

/** Label type accepted by WatersDiagram to set translatable text labels  */
export interface Label {
  /** Unique string id, used to update defaults or add new */
  key: string;
  /** Displayed text in diagram */
  labelText?: string;
  /** X offset from top left in pixels */
  x?: string | number;
  /** Y offset from top left in pixels */
  y?: string | number;
  /** CSS style properties for text. Defaults to 12pt Helvetica */
  style?: React.CSSProperties;
}

/**
 * Creates detailed territorial waters svg to be used in WatersDiagram
 *
 */
export function WatersBackgroundBelize() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="492.52"
      height="734.55"
      version="1"
    >
      <defs>
        <marker orient="auto" overflow="visible" refX="0" refY="0">
          <path
            fillRule="evenodd"
            stroke="#000"
            strokeWidth=".4pt"
            markerStart="none"
            d="M0 0l2-2-7 2 7 2-2-2z"
          ></path>
        </marker>
        <marker orient="auto" overflow="visible" refX="0" refY="0">
          <path
            fillRule="evenodd"
            stroke="#000"
            strokeWidth=".8pt"
            markerStart="none"
            d="M0 0l-4 4 14-4-14-4 4 4z"
          ></path>
        </marker>
        <marker orient="auto" overflow="visible" refX="0" refY="0">
          <path
            fillRule="evenodd"
            stroke="#000"
            strokeWidth=".8pt"
            markerStart="none"
            d="M0 0l4-4-14 4L4 4 0 0z"
          ></path>
        </marker>
        <pattern
          width="129.836"
          height="79.817"
          patternTransform="translate(50.276 605.972)"
          patternUnits="userSpaceOnUse"
        >
          <path
            style={{ marker: "none" }}
            fill="#f4ff00"
            fillOpacity="1"
            fillRule="evenodd"
            stroke="#000"
            strokeDasharray="2, 2"
            strokeDashoffset="0"
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeMiterlimit="4"
            strokeOpacity="1"
            strokeWidth="1"
            markerEnd="none"
            markerMid="none"
            markerStart="none"
            d="M0.5 0.5H129.336V79.317H0.5z"
            color="#000"
            display="inline"
            opacity="1"
            overflow="visible"
            visibility="visible"
          ></path>
        </pattern>
      </defs>
      <path
        fill="#d3ebfa"
        fillOpacity="1"
        fillRule="evenodd"
        stroke="none"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeOpacity="1"
        strokeWidth="1.014"
        d="M495.614.303l.036 235.84s-78.01-63.51-87.777-65.676c-9.766-2.167-79.214-39.01-88.98-44.428-9.904-5.494-100.916-34.673-175.789-46.59-73.97-11.772-70.531-8.665-111.765-6.494C-4.419 74.837.956 69.705.956 69.705L.951.346z"
      ></path>
      <path
        fill="#bfe3fa"
        fillOpacity="1"
        fillRule="evenodd"
        stroke="none"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeOpacity="1"
        strokeWidth="1.007"
        d="M493.03 229.001l.003 42.764.664 89.037-83.531-19.234-199.135-34.23C175.447 730.048 30.045 284.862.051 282.726l-1.238-106-.008-105.84s46.71 2.293 54.205-2.142c10.84-6.415 63.962 2.134 63.962 2.134s137.856 27.852 168.04 39.544c19.197 7.438 126.843 52.377 126.843 52.377z"
      ></path>
      <path
        fill="#abdcfc"
        fillOpacity="1"
        fillRule="evenodd"
        stroke="none"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeOpacity="1"
        strokeWidth="0.857"
        d="M492.555 330.777l-133.64-65.962-112.91 9.616-59.736-8.489-86.888-4.628-97.81-4.577-4.265 188.326 132.507 25.47 194.41-2.326 52.134 6.174 49.962 8.49 66.252 3.857z"
      ></path>
      <path
        fill="#82cbfb"
        fillOpacity="1"
        fillRule="evenodd"
        stroke="none"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeOpacity="1"
        strokeWidth="1.428"
        d="M-3.19 361.233L.229 513.392l77.28-6.362 114.206 53.019 163.721 55.066 36.386-27.555 21.356-24.092 48.35 10.855 31.15 13.764-.003-144.306-84.592-33.99-36.345-40.424-30.513-13.896-52.732 32.705-74.112 10.996-90.98-18.448z"
      ></path>
      <path
        fill="#f4e2ba"
        fillOpacity="1"
        fillRule="evenodd"
        stroke="none"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeOpacity="1"
        strokeWidth="1.019"
        d="M494.4 553.132l.014 185.118-497.948-1.044 1.001-249.368 54.363 7.612 133.06 15.852s12.398 26.464 20.028 22.108c7.63-4.356 30.364-23.115 30.364-23.115l59.634 6.916s9.81 0 22.892 9.799c13.082 9.8 18.534 42.467 35.975 35.932 17.44-6.535 32.7-20.692 32.7-20.692s15.26-19.602 34.881-14.158c19.622 5.443 51.234 7.618 51.234 7.618z"
      ></path>
      <path
        d="M343.641 404.549a33.142 18.71 32.196 01-18.235-33.233 33.142 18.71 32.196 0137.26 1.006 33.142 18.71 32.196 0119.44 33.265 33.142 18.71 32.196 01-36.633.069"
        style={{ marker: "none" }}
        fill="#f4e2ba"
        fillOpacity="1"
        fillRule="evenodd"
        stroke="none"
        strokeDasharray="1, 1"
        strokeDashoffset="1.1"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeMiterlimit="4"
        strokeOpacity="1"
        strokeWidth="1"
        markerEnd="none"
        markerMid="none"
        markerStart="none"
        color="#000"
        display="inline"
        overflow="visible"
        visibility="visible"
      ></path>
      <path
        fill="none"
        stroke="#000"
        strokeDasharray="4.01949, 4.01949"
        strokeDashoffset="0"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeOpacity="1"
        strokeWidth="1.005"
        d="M0 487.05l39.943 6.508 143.665 16.924 7.731 13.67 7.731 9.113 4.51.65 3.221-1.301 28.346-22.783 57.982 7.16 10.308 1.953 10.952 5.208 9.663 9.764 9.02 16.273 7.086 10.414 4.51 2.604 5.154 1.302 6.442-1.953 11.597-6.51 12.884-8.461 9.664-9.113 7.73-6.51 10.309-4.556 8.375-.65 10.308 2.603 10.952 2.604 24.48 3.254h9.02l9.02 7.16 12.24 11.066v0"
      ></path>
      <path
        fill="none"
        stroke="#000"
        strokeDasharray="4, 4"
        strokeDashoffset="0"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeOpacity="1"
        strokeWidth="1"
        d="M326.992 368.884l-3.002 4.502-.75 4.877 1.125 5.253 3.002 5.252 4.502 6.003 6.378 6.378 7.503 4.502 8.254 4.127 6.754 1.876 7.503.75 6.753-1.125 5.253-3.377 3.001-5.627-.375-6.379-3.001-7.503-7.504-8.63-7.503-6.002-7.504-4.127-7.504-3.001-8.254-1.876h-7.128l-5.252 2.25z"
      ></path>
    </svg>
  );
}
