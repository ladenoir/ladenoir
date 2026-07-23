import { domAnimation } from "motion/react";

/**
 * Isolated module boundary for MotionProvider.tsx's async `features` loader.
 * Bundlers only split a dynamic `import()` into its own chunk when the
 * specifier points at a distinct module — `import("./motion-features")`
 * inside MotionProvider.tsx's `loadFeatures` callback needs this file to
 * exist so `domAnimation` (and everything it pulls in) lands in a chunk
 * that ships separately from, and after, first-load JS.
 */
export default domAnimation;
