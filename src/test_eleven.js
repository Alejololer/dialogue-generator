async function generateAudio(text, voice = "Paulo") {
    const options = {
        method: 'POST',
        headers: {
            'xi-api-key': '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text,
            voice,
            model_id: 'eleven_multilingual_v2',
            output_format: 'mp3_44100_128'
        })
    };

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb?output_format=mp3_44100_128', options)
    return await response.body
}
const response = await generateAudio("¡Este man sí sabe cómo hablar!")
console.log(response)
