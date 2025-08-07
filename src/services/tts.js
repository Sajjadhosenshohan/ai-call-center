import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.join(__dirname, "../audio_output");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

export const textToSpeech = async (text) => {
  try {
    console.log("Text to speech request:", text);
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, // Default voice: Rachel
      {
        text: text,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
        },
      },
      {
        headers: {
          "xi-api-key": null, // Provided API key
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    // console.log("Text to speech response:", response.status, response.data);

    const audioUrl = await uploadToStorage(response.data);
    console.log("audioUrl", audioUrl);
    return audioUrl;
  } catch (error) {
    console.error(
      "Text-to-speech error:",
      error.response ? error.response.data : error.message
    );
    throw error; // Propagate error for handling in callHandler
  }
};

async function uploadToStorage(audioBuffer) {
  const filename = `response_${Date.now()}.mp3`;
  const filePath = path.join(audioDir, filename);
  fs.writeFileSync(filePath, Buffer.from(audioBuffer));
  return `/audio/${filename}`;
}
