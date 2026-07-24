"use client";

/**
 * One-time WebGL capability probe, run before the canvas mounts so the
 * experience starts at the right quality instead of discovering it by
 * stuttering. Software rasterizers (SwiftShader/SwANGLE/llvmpipe — CI,
 * VMs, GPU-blocklisted browsers) get webgl2=true but software=true:
 * they render the world at the floor tier with no postprocessing.
 */
export interface GlCapability {
  webgl2: boolean;
  software: boolean;
  renderer: string;
}

let cached: GlCapability | null = null;

export function probeGl(): GlCapability {
  if (cached) return cached;
  const result: GlCapability = { webgl2: false, software: false, renderer: "none" };
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (gl) {
      result.webgl2 = true;
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = dbg
        ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER));
      result.renderer = renderer;
      result.software = /swiftshader|llvmpipe|software|swangle/i.test(renderer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    /* stays webgl2:false */
  }
  cached = result;
  return result;
}
