// Shrinks a photo in the browser before upload: center-cropped to a square and
// scaled to at most `size` px, as WebP (or JPEG where WebP can't be encoded).
// Phone photos of several MB become a sharp avatar of a few hundred KB.
export async function resizeToSquare(file: File, size = 800): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const target = Math.min(size, side);
    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas isn't available");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      target,
      target,
    );
    const encode = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await encode("image/webp", 0.9);
    if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.9);
    if (!blob) throw new Error("Couldn't encode the image");
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `avatar.${ext}`, { type: blob.type });
  } finally {
    bitmap.close();
  }
}
