// Cloudflare Worker for Generate Dialogue
// Using ElevenLabs for TTS instead of OpenAI
import { ElevenLabsClient, play } from 'elevenlabs';

const elevenlabs = new ElevenLabsClient({
	apiKey: elevenLabsApiKey,
});

const SYSTEM_PROMPT = `
Eres un generador de frases cortas para un mitin político ecuatoriano.
Instrucciones Vitales:
Objetivo: Genera UNA SOLA frase o expresión corta de apoyo de UNA PERSONA en un mitin político ecuatoriano.
Sentimiento: Fuerte apoyo y entusiasmo hacia el político que está dando un discurso principal.
Estilo: Conversacional, natural, espontáneo. Uso de jerga ecuatoriana, expresiones locales e incluso malas palabras ocasionales para autenticidad.
Formato: NO incluyas "Persona 1:" ni ningún otro indicador de quién habla. Solo genera la frase directamente.
Longitud: MUY IMPORTANTE: Solo UNA frase corta o máximo DOS frases breves (no más de 20-25 palabras en total).

Ejemplos de frases deseadas (sin indicadores de persona):

"¡Este man sí sabe cómo hablar!"

"¡Eso, presidente! ¡Así se habla! ¡Ecuador te apoya!"

"¡Qué energía! ¡Este mitin está que revienta!"

"¡Verga, este sí nos representa, carajo!"

"Bueno, bonito el discurso. Esperemos que no sea solo bla bla bla como los otros."

Prompt Maestro:

"Genera UNA SOLA frase o expresión corta (máximo 25 palabras) de una persona apoyando a un político en un mitin en Ecuador. NO incluyas indicadores como 'Persona 1:'. Usa jerga ecuatoriana y lenguaje natural. La frase debe ser directa y lista para ser leída por un sistema TTS."
`;

const voiceDatabase = [
	{
		id: '9BWtsMINqrJLrRacOk9x',
		name: 'Aria',
		gender: 'Female',
		accent: 'spanish',
	},
	{
		id: 'CwhRBWXzGAHq8TQ4Fs17',
		name: 'Roger',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'EXAVITQu4vr4xnSDxMaL',
		name: 'Sarah',
		gender: 'Female',
		accent: 'spanish',
	},
	{
		id: 'FGY2WhTYpPnrIDTdsKH5',
		name: 'Laura',
		gender: 'Female',
		accent: 'spanish',
	},
	{
		id: 'IKne3meq5aSn9XLyUdCD',
		name: 'Charlie',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'JBFqnCBsd6RMkjVDRZzb',
		name: 'George',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'N2lVS1w4EtoT3dr4eOWO',
		name: 'Callum',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'SAz9YHcvj6GT2YYXdXww',
		name: 'River',
		gender: 'Neutral/Non-Binary',
		accent: 'spanish',
	},
	{
		id: 'TX3LPaxmHKxFdv7VOQHJ',
		name: 'Liam',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'XB0fDUnXU5powFXDhCwa',
		name: 'Charlotte',
		gender: 'Female',
		accent: 'spanish',
	},
	{
		id: 'Xb7hH8MSUJpSbSDYk0k2',
		name: 'Alice',
		gender: 'Female',
		accent: 'spanish',
	},
	{
		id: 'XrExE9yKIg1WjnnlVkGX',
		name: 'Matilda',
		gender: 'Female',
		accent: 'spanish',
	},
	{
		id: 'bIHbv24MWmeRgasZH58o',
		name: 'Will',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'cgSgspJ2msm6clMCkdW9',
		name: 'Jessica',
		gender: 'Female',
		accent: 'spanish',
	},
	{
		id: 'cjVigY5qzO86Huf0OWal',
		name: 'Eric',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'iP95p4xoKVk53GoZ742B',
		name: 'Chris',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'nPczCjzI2devNBz1zQrb',
		name: 'Brian',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'onwK4e9ZLuTAKqWW03F9',
		name: 'Daniel',
		gender: 'Male',
		accent: 'spanish',
	},
	{
		id: 'pFZP5JQG7iQjIQuC4Bku',
		name: 'Lily',
		gender: 'Female',
		accent: 'spanish',
	},
	{
		id: 'pqHfZKP75CvOlQylNhV4',
		name: 'Bill',
		gender: 'Male',
		accent: 'spanish',
	},
];

async function getPhrase(openaiApiKey) {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${openaiApiKey}`,
		},
		body: JSON.stringify({
			model: 'gpt-3.5-turbo',
			temperature: 0.7,
			messages: [
				{
					role: 'system',
					content: SYSTEM_PROMPT,
				},
			],
		}),
	});

	const completion = await response.json();
	let phrase = completion.choices[0].message.content || '';

	phrase = phrase.replace(/^(Persona \d+:|Pensamiento:)\s*/i, '');
	phrase = phrase.replace(/^\(|\)$/g, '');

	return phrase;
}

async function generateAudio(elevenLabsApiKey, text, voice = 'Paulo') {
	const options = {
		method: 'POST',
		headers: {
			'xi-api-key': elevenLabsApiKey,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			text,
			voice,
			model_id: 'eleven_multilingual_v2',
			output_format: 'mp3_44100_128',
		}),
	};

	const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb?output_format=mp3_44100_128', options);
	return await response.body;
}

export default {
	async fetch(request, env) {
		const openaiApiKey = env.OPENAI_API_KEY;
		const elevenLabsApiKey = env.ELEVENLABS_API_KEY;
		const phrase = await getPhrase(openaiApiKey);
		const audio = await generateAudio(elevenLabsApiKey, phrase);

		return new Response(audio, {
			headers: {
				'Content-Type': 'audio/mpeg', // Set the correct content type
				'Content-Disposition': 'inline; filename=generated_audio.mp3', //Optional: For browser download.
			},
		});
	},
};
