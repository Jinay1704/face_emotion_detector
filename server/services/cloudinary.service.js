const cloudinary = require("../config/cloudinary");

const uploadBuffer = (buffer, folder, resourceType) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType || "image", quality: "auto", fetch_format: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const uploadBase64 = async (base64String, folder) => {
  const result = await cloudinary.uploader.upload(
    "data:image/jpeg;base64," + base64String,
    { folder, resource_type: "image", quality: "auto" }
  );
  return { url: result.secure_url, publicId: result.public_id };
};

const deleteFile = (publicId, resourceType) =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType || "image" });

module.exports = { uploadBuffer, uploadBase64, deleteFile };
