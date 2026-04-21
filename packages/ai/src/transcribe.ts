export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm'
): Promise<TranscriptionResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return { text: '', confidence: 0, duration: 0, words: [] };
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': mimeType,
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      console.error('Deepgram API error:', await response.text());
      return { text: '', confidence: 0, duration: 0, words: [] };
    }

    const result = await response.json();
    const transcript = result.results?.channels?.[0]?.alternatives?.[0];

    if (!transcript) {
      return { text: '', confidence: 0, duration: 0, words: [] };
    }

    return {
      text: transcript.transcript || '',
      confidence: transcript.confidence || 0,
      duration: result.metadata?.duration || 0,
      words: transcript.words?.map((w: any) => ({
        word: w.word,
        start: w.start || 0,
        end: w.end || 0,
        confidence: w.confidence || 0,
      })) || [],
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return { text: '', confidence: 0, duration: 0, words: [] };
  }
}

export async function transcribeFromUrl(
  url: string
): Promise<TranscriptionResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return { text: '', confidence: 0, duration: 0, words: [] };
  }

  try {
    const response = await fetch(`https://api.deepgram.com/v1/listen?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('Deepgram API error:', await response.text());
      return { text: '', confidence: 0, duration: 0, words: [] };
    }

    const result = await response.json();
    const transcript = result.results?.channels?.[0]?.alternatives?.[0];

    if (!transcript) {
      return { text: '', confidence: 0, duration: 0, words: [] };
    }

    return {
      text: transcript.transcript || '',
      confidence: transcript.confidence || 0,
      duration: result.metadata?.duration || 0,
      words: [],
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return { text: '', confidence: 0, duration: 0, words: [] };
  }
}
