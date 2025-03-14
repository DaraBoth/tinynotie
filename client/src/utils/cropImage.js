export default function getCroppedImg(imageSrc, crop, originalFileName = "image") {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = crop.width;
      canvas.height = crop.height;

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

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const fileExtension = originalFileName.split(".").pop() || "jpg"; // Extract file extension
        const fileNameWithoutExtension = originalFileName.replace(/\.[^/.]+$/, ""); // Remove extension
        const croppedFileName = `${fileNameWithoutExtension}_cropped.${fileExtension}`; // Append "_cropped"
        const file = new File([blob], croppedFileName, { type: `image/${fileExtension}` }); // Use original name with "_cropped"
        resolve(file);
      }, "image/jpeg");
    };

    image.onerror = (error) => reject(error);
  });
}
