// Pointer coordinates are CSS pixels, independent of drawing-buffer DPI.
export function pointerNDC(clientX, clientY, rect) {
  if (rect.width <= 0 || rect.height <= 0) return null;
  return { x: (clientX - rect.left) / rect.width * 2 - 1,
    y: -(clientY - rect.top) / rect.height * 2 + 1 };
}
