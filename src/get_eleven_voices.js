import { ElevenLabsClient } from "elevenlabs";

const elevenlabs = new ElevenLabsClient({
    apiKey: "sk_95485b4ce83dbcfb4bab97ab7e3c69135c47cb914f3039f6"
})

const voices = await elevenlabs.voices.getAll();

console.log(voices);