import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, style, aspectRatio } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build the Pollinations API URL
    let pollinationsPrompt = prompt;
    if (style && style !== 'Default') pollinationsPrompt += `, ${style}`;
    // You can add aspect ratio handling if Pollinations supports it

    const width = 1024;
    const height = 1024;
    const model = 'flux'; // or any other model Pollinations supports

    const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(pollinationsPrompt)}?width=${width}&height=${height}&model=${model}`;

    // The API returns the image directly, so just return the URL
    return NextResponse.json({
      image: apiUrl,
      success: true
    });
  } catch (error) {
    console.error('Generation error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Image generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 