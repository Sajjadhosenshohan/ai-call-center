import { transcribeAudio } from "./stt.js";
import { generateAIResponse } from "./openaiService.js";
import { textToSpeech } from "./tts.js";

const companyDocs = [
  { id: 1, title: "Pricing", content: "Basic plan starts at $29/month..." },
  { id: 2, title: "Support", content: "Contact support at help@example.com..." }
];

export const handleIncomingCall = async (callData) => {
  try {
    // Assume callData.audioUrl is already AssemblyAI upload URL (public URL)
    const audioUrl = callData.audioUrl;

    // 1. Transcribe audio from AssemblyAI URL
    const customerQuery = await transcribeAudio(audioUrl); //done
    // console.log("Customer query:", customerQuery);

    // 2. Generate AI response based on transcription and company docs
    const aiResponse = await generateAIResponse({
      query: customerQuery,
      context: companyDocs,
      caller: callData.from,
    }); // done

    console.log("AI response:", aiResponse);

    // 3. Convert AI text response to speech via ElevenLabs TTS
    const audioResponseUrl = await textToSpeech(aiResponse);

    // Return results
    return {
      originalQuery: customerQuery,
      aiResponse: aiResponse,
      audioUrl: audioResponseUrl,
    };

  } catch (error) {
    console.error("Call processing error:", error);
    return {
      audioUrl: "https://demo.twilio.com/docs/classic.mp3",
    };
  }
};
