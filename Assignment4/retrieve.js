const axios = require("axios");

const CID = "QmRjLWT4PToKqcMxu3zZX7HCHrdk8mJJsxJpiMmDq5Msj2";

async function getFile() {
  try {
    const url = `https://gateway.pinata.cloud/ipfs/${CID}`;
    const res = await axios.get(url);

    console.log("✅ File retrieved successfully!");
    console.log(res.data);
  } catch (err) {
    console.error("Error retrieving file:", err);
  }
}

getFile();