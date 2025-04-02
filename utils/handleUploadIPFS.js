const FormData = require("form-data");
const fetch = require("node-fetch");

const uploadToPinata = async (fileBuffer, fileName) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const data = new FormData();
  data.append("file", fileBuffer, fileName);

  const metadata = JSON.stringify({ name: fileName });
  data.append("pinataMetadata", metadata);

  const options = JSON.stringify({ cidVersion: 0 });
  data.append("pinataOptions", options);

  const response = await fetch(url, {
    method: "POST",
    body: data,
    headers: {
      ...data.getHeaders(),
      pinata_api_key: process.env.PINATA_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(`Error al subir el archivo: ${response.statusText}`);
  }

  const responseData = await response.json();
  return responseData;
};

module.exports = { uploadToPinata };
