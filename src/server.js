// server.js (Express version)
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import { twilioRoutes } from "./routes/twilioStream.js";

dotenv.config();


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// console.log(OPENAI_API_KEY)
app.use(bodyParser.json());
app.use("/", twilioRoutes);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});