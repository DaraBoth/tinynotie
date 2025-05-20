export default function getCroppedImg(imageSrc, crop, originalFileName = "image", rotation = 0) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate bounding box of the rotated image
      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      // Set canvas dimensions to match the cropped area
      canvas.width = crop.width;
      canvas.height = crop.height;

      // Draw rotated image if rotation is specified
      if (rotation !== 0) {
        // Create a temporary canvas for rotation
        const rotationCanvas = document.createElement("canvas");
        const rotationCtx = rotationCanvas.getContext("2d");

        // Set dimensions for the rotation canvas
        rotationCanvas.width = safeArea;
        rotationCanvas.height = safeArea;

        // Move to center of canvas
        rotationCtx.translate(safeArea / 2, safeArea / 2);
        rotationCtx.rotate((rotation * Math.PI) / 180);
        rotationCtx.translate(-image.width / 2, -image.height / 2);

        // Draw the original image onto the rotation canvas
        rotationCtx.drawImage(image, 0, 0);

        // Draw the rotated image onto the final canvas, cropped to the desired area
        ctx.drawImage(
          rotationCanvas,
          safeArea / 2 - image.width / 2 + crop.x,
          safeArea / 2 - image.height / 2 + crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );
      } else {
        // No rotation, just crop
        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );
      }

      // Convert to blob and create file
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const fileExtension = originalFileName.split(".").pop() || "jpg"; // Extract file extension
        const fileNameWithoutExtension = originalFileName.replace(/\.[^/.]+$/, ""); // Remove extension
        const croppedFileName = `${fileNameWithoutExtension}_cropped.${fileExtension}`; // Append "_cropped"
        const file = new File([blob], croppedFileName, {
          type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
          lastModified: new Date().getTime()
        });
        resolve(file);
      }, "image/jpeg", 0.95); // Use 95% quality for JPEG
    };

    image.onerror = (error) => reject(error);
  });
}
