/**
 * Page24 — ambient module types for Vite raw SVG imports.
 * The pattern '*.svg?raw' does not overlap with Vite's own `vite/client`
 * declarations ('*.svg', '*?raw'), so it is safe to keep alongside them.
 */
declare module '*.svg?raw' {
  const content: string;
  export default content;
}
