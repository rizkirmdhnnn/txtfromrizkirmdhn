// Font di-import sebagai data URL base64 (?inline); wasm sebagai modul
// WebAssembly yang sudah dikompilasi (aturan modul CompiledWasm Workers).
declare module "*.ttf?inline" {
  const src: string;
  export default src;
}
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}
