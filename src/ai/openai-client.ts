import { getEnv } from "@/shared/env";
import OpenAI from "openai";

process.loadEnvFile();

export const openai = new OpenAI({
  apiKey: getEnv().OPENAI_API_KEY,
});
