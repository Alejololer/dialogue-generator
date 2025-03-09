// Cloudflare Worker for Generate Dialogue
// Using ElevenLabs for TTS instead of OpenAI

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
		voice_id: 'qyrGJ30fywarSl4a3pNp',
		name: 'Milli- Calm Narrator',
		gender: 'female',
	},
	{
		voice_id: 'dF1Qg3iMRirscWEMtEKb',
		name: 'Diego Cárdenas',
		gender: 'male',
	},
	{
		voice_id: '9EU0h6CVtEDS6vriwwq5',
		name: 'Young & Soft Latin Female Voice',
		gender: 'female',
	},
	{
		voice_id: 'tomkxGQGz4b1kE0EM722',
		name: 'Mario',
		gender: 'male',
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

async function generateAudio(text, elevenLabsApiKey, voice = 'Paulo') {
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
		const audio = await generateAudio(phrase, elevenLabsApiKey, 'Paulo');

		return new Response(audio, {
			headers: {
				'Content-Type': 'audio/mpeg', // Set the correct content type
				'Content-Disposition': 'inline; filename=generated_audio.mp3', //Optional: For browser download.
			},
		});
	},
};
