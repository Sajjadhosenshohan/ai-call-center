

import axios from "axios";

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY || "";

export const transcribeAudio = async (audioUrl) => {
  // Step 1: Create transcription job
  const createResponse = await axios.post(
    "https://api.assemblyai.com/v2/transcript",
    { audio_url: audioUrl },
    {
      headers: { authorization: ASSEMBLY_API_KEY },
    }
  );

  const transcriptId = createResponse.data.id;

  // Step 2: Poll for completion
  let transcription = null;
  while (!transcription) {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // wait 1.5s

    const pollResponse = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: { authorization: ASSEMBLY_API_KEY },
      }
    );

    const status = pollResponse.data.status;

    if (status === "completed") {
      transcription = pollResponse.data.text;
    } else if (status === "error") {
      throw new Error("Transcription failed: " + pollResponse.data.error);
    }
    // else status could be 'queued', 'processing' → keep polling
  }

  return transcription;
};
