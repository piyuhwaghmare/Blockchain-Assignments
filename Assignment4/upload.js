const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const PINATA_API_KEY = "fed360d88091147f7e0d";
const PINATA_SECRET_API_KEY = "6d344e660d8bee1142ea4517ad1704d5ab50dfdbe0d08d0fb9e62484a3725ba1";

async function uploadFile() {
  const data = new FormData();
  data.append("file", fs.createReadStream("sample.txt"));

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        headers: {
          ...data.getHeaders(),
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    console.log("✅ File uploaded successfully!");
    console.log("CID:", res.data.IpfsHash);
  } catch (err) {
    console.error("Error uploading file:", err);
  }
}

uploadFile();