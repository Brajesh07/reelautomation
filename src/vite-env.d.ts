/// <reference types="vite/client" />

// Vite's client types declare lowercase asset extensions only; the fonts in
// src/fonts are imported with an uppercase `.TTF` extension.
declare module '*.TTF' {
  const src: string;
  export default src;
}
