import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { handleIncomingCall } from "../services/callHandler.js";
import dotenv from "dotenv";
import twilio from "twilio";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

dotenv.config();
const VoiceResponse = twilio.twiml.VoiceResponse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const ASSEMBLY_API_KEY =
  process.env.ASSEMBLY_API_KEY ;

// Helper to upload audio file to AssemblyAI
async function uploadToAssemblyAI(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const response = await axios({
    method: "post",
    url: "https://api.assemblyai.com/v2/upload",
    headers: {
      authorization: ASSEMBLY_API_KEY,
      "transfer-encoding": "chunked",
    },
    data: fileStream,
  });
  return response.data.upload_url;
}


// Serve audio files statically
router.use("/audio", express.static(path.join(__dirname, "../audio_output")));

// --- Route 1: Upload & process MP3 directly (e.g., via Postman form-data)
router.post("/process-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const assemblyUploadUrl = await uploadToAssemblyAI(req.file.path);

    const info =
      typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body.data;

    const twiml = new VoiceResponse();
    const { from, to, callSid } = info || {};
    const result = await handleIncomingCall({
      audioUrl: assemblyUploadUrl,
      from: from,
      to: to,
      callSid: callSid,
    });

    fs.unlinkSync(req.file.path); // Clean up

    // Construct full audio URL
    const baseUrl = "https://7d6b053cb9dd.ngrok-free.app"; // Set in .env or hardcoded
    const fullAudioUrl = `${baseUrl}${result.audioUrl}`;

    console.log("Full result with URL:", { ...result, audioUrl: fullAudioUrl });
    twiml.play(fullAudioUrl); // Play the full URL
    res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.error("Audio processing error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Route 2: Serve audio files (optional, if you save any TTS files locally)
router.get("/audio/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../audio_output", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Audio file not found");
  }

  res.set("Content-Type", "audio/mpeg");
  res.sendFile(filePath);
});

// // --- Route 3: Twilio inbound call webhook
// router.post("/twilio-inbound", async (req, res) => {
//   try {
//     const twiml = new VoiceResponse();
//     const callData = {
//       from: req.body.From,
//       to: req.body.To,
//       callSid: req.body.CallSid,
//       recordingRequired: true,
//     };

//     console.log("Twilio call received:", callData);

//     twiml.say("Thank you for calling. Please wait while we connect you.");
//     twiml.record({
//       action: "/twilio-recording-callback",
//       method: "POST",
//       maxLength: 30,
//       playBeep: true,
//     });

//     res.type("text/xml");
//     res.send(twiml.toString());
//   } catch (error) {
//     console.error("Twilio call handling error:", error);
//     const twiml = new VoiceResponse();
//     twiml.say(
//       "We're experiencing technical difficulties. Please call back later."
//     );
//     res.type("text/xml").send(twiml.toString());
//   }
// });

// // --- Route 4: Twilio recording callback webhook
// router.post("/twilio-recording-callback", async (req, res) => {
//   try {
//     const recordingUrl = req.body.RecordingUrl; // no .mp3 here yet
//     const callData = {
//       from: req.body.From,
//       to: req.body.To,
//       callSid: req.body.CallSid,
//       audioUrl: `${recordingUrl}.mp3`, // Append .mp3 for Twilio recording URL
//     };

//     console.log("Recording callback received:", callData);

//     const result = await handleIncomingCall(callData);

//     const twiml = new VoiceResponse();
//     twiml.play(result.audioUrl); // play AI TTS response to caller
//     res.type("text/xml").send(twiml.toString());
//   } catch (error) {
//     console.error("Recording callback error:", error);
//     const twiml = new VoiceResponse();
//     twiml.say("We couldn't process your request. Goodbye.");
//     res.type("text/xml").send(twiml.toString());
//   }
// });

// Existing Twilio routes
router.post("/twilio-inbound", async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Thank you for calling. Please wait while we connect you.");
  twiml.record({
    action: "/twilio-recording-callback",
    method: "POST",
    maxLength: 30,
    playBeep: true,
  });
  res.type("text/xml").send(twiml.toString());
});

router.post("/twilio-recording-callback", async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const result = await handleIncomingCall(req.body);
  twiml.play(result.audioUrl); // Play the full URL
  res.type("text/xml").send(twiml.toString());
});

export const twilioRoutes = router;
