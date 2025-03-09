// Cloudflare Worker for Generate Dialogue
// Using ElevenLabs for TTS instead of OpenAI

export default {
	async fetch(request, env) {
		// Parse request URL to get query parameters
		const url = new URL(request.url);
		const gender = url.searchParams.get('gender') || '';
		const returnFormat = url.searchParams.get('format') || 'stream'; // Default to stream for Unity

		try {
			// ElevenLabs voice database with focus on Spanish/Latin American voices
			// Each voice includes ID, name, gender, and accent information
			const voiceDatabase = [
				// Male Spanish/Latin voices
				{ id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Antonio', gender: 'male', accent: 'spanish' },
				{ id: 'VR6AewLTigWG4xSOukaG', name: 'Nico', gender: 'male', accent: 'spanish' },
				{ id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', accent: 'spanish' },
				// Female Spanish/Latin voices
				{ id: 'pMsXgVXv3BLzLuULWd7j', name: 'Lupe', gender: 'female', accent: 'spanish' },
				{ id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', accent: 'spanish' },
				{ id: '3KehPe3bQEzWYSDhMGE2', name: 'Mia', gender: 'female', accent: 'spanish' },
				// Additional voices (not necessarily Spanish-focused)
				{ id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', accent: 'neutral' },
				{ id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', accent: 'neutral' },
				{ id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', accent: 'neutral' },
				{ id: 'D38z5RcWu1voky8WS1ja', name: 'Sarah', gender: 'female', accent: 'neutral' },
			];

			// Filter voices based on the requested gender
			let eligibleVoices;

			if (gender === 'male') {
				// Filter for male voices, prioritize Spanish/Latin ones
				const spanishMaleVoices = voiceDatabase.filter((v) => v.gender === 'male' && v.accent === 'spanish');
				const otherMaleVoices = voiceDatabase.filter((v) => v.gender === 'male' && v.accent !== 'spanish');

				// Use Spanish male voices if available, otherwise fall back to all male voices
				eligibleVoices = spanishMaleVoices.length > 0 ? spanishMaleVoices : [...spanishMaleVoices, ...otherMaleVoices];
			} else if (gender === 'female') {
				// Filter for female voices, prioritize Spanish/Latin ones
				const spanishFemaleVoices = voiceDatabase.filter((v) => v.gender === 'female' && v.accent === 'spanish');
				const otherFemaleVoices = voiceDatabase.filter((v) => v.gender === 'female' && v.accent !== 'spanish');

				// Use Spanish female voices if available, otherwise fall back to all female voices
				eligibleVoices = spanishFemaleVoices.length > 0 ? spanishFemaleVoices : [...spanishFemaleVoices, ...otherFemaleVoices];
			} else {
				// If no gender specified or "neutral" specified, prioritize Spanish voices
				const spanishVoices = voiceDatabase.filter((v) => v.accent === 'spanish');
				eligibleVoices = spanishVoices.length > 0 ? spanishVoices : voiceDatabase;
			}

			// Select a random voice from the eligible ones
			const selectedVoiceObj = eligibleVoices[Math.floor(Math.random() * eligibleVoices.length)];
			const selectedVoice = selectedVoiceObj.id;

			// Generate the phrase using ChatGPT
			const openaiApiKey = env.OPENAI_API_KEY;
			const elevenLabsApiKey = env.ELEVENLABS_API_KEY;

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
							content: 'Eres un generador de frases cortas para un mitin político ecuatoriano.',
						},
						{
							role: 'user',
							content: `
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
				`,
						},
					],
				}),
			});

			const completion = await response.json();
			let phrase = completion.choices[0].message.content || '';

			// Clean up the phrase
			phrase = phrase.replace(/^(Persona \d+:|Pensamiento:)\s*/i, '');
			phrase = phrase.replace(/^\(|\)$/g, '');

			// Determine speech parameters based on content
			// ElevenLabs uses different parameters
			let stability = 0.5;
			let similarity_boost = 0.75;

			// Adjust parameters based on content
			if (phrase.includes('!')) {
				stability = 0.4; // Less stability for more expressive output with exclamations
				similarity_boost = 0.8; // Higher similarity for more intensity
			} else if (phrase.includes('?')) {
				stability = 0.6; // More stability for questions
				similarity_boost = 0.7;
			}

			try {
				// Generate audio with ElevenLabs
				const speechResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}/stream`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'xi-api-key': elevenLabsApiKey,
					},
					body: JSON.stringify({
						text: phrase,
						model_id: 'eleven_multilingual_v2', // Multilingual model for Spanish support
						voice_settings: {
							stability,
							similarity_boost,
						},
						// Add optimization hint for Spanish content
						optimize_streaming_latency: 4,
					}),
				});

				// If format is 'stream' (default), return the audio as a streaming response for Unity
				if (returnFormat === 'stream') {
					// Get the audio stream and pass it through
					return new Response(speechResponse.body, {
						status: 200,
						headers: {
							'Content-Type': 'audio/mpeg',
							'Content-Disposition': 'attachment; filename="dialogue.mp3"',
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Methods': 'GET, OPTIONS',
						},
					});
				}

				// If format is 'json', return dialogue info as JSON
				return new Response(
					JSON.stringify({
						dialogue: {
							text: phrase,
							voice: selectedVoice,
						},
					}),
					{
						status: 200,
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Methods': 'GET, OPTIONS',
						},
					}
				);
			} catch (speechError) {
				console.error('Error with ElevenLabs API:', speechError);
				// Return text-only response if speech fails
				return new Response(
					JSON.stringify({
						dialogue: {
							text: phrase,
							voice: selectedVoice,
							voice_name: selectedVoiceObj.name,
							voice_gender: selectedVoiceObj.gender,
							voice_accent: selectedVoiceObj.accent,
							error: 'Speech generation failed',
						},
					}),
					{
						status: 200,
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Methods': 'GET, OPTIONS',
						},
					}
				);
			}
		} catch (err) {
			console.error('Error in generate-dialogue function:', err);
			return new Response(JSON.stringify({ error: 'Failed to generate dialogue', details: err.message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};
