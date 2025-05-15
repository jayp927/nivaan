import { NextResponse } from 'next/server';
import axios from 'axios';

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

    // Create form data
    const formData = new URLSearchParams();
    formData.append('prompt', prompt);
    formData.append('style', style || 'Default');
    formData.append('aspectRatio', aspectRatio || 'Default');
    formData.append('width', '1024');
    formData.append('height', '1024');
    formData.append('enhancePrompt', 'true');
    formData.append('privateImage', 'false');

    // Make the request to generate the image
    const response = await axios({
      method: 'post',
      url: 'https://www.desktophut.com/page/free-ai-image-generator',
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://www.desktophut.com',
        'Referer': 'https://www.desktophut.com/page/free-ai-image-generator',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      maxRedirects: 5,
      timeout: 60000
    });

    // Check if response is HTML
    if (typeof response.data !== 'string' || !response.data.includes('<!DOCTYPE')) {
      console.error('Unexpected response format:', response.data);
      return NextResponse.json(
        { error: 'Invalid response from image generator' },
        { status: 500 }
      );
    }

    // Extract the image URL from the HTML response
    const htmlContent = response.data;
    
    // Try different patterns to find the image URL
    const patterns = [
      /<img[^>]+src="([^"]+)"[^>]+class="generated-image"/,
      /<img[^>]+class="generated-image"[^>]+src="([^"]+)"/,
      /<img[^>]+src="([^"]+)"[^>]+alt="Generated Image"/,
      /<img[^>]+alt="Generated Image"[^>]+src="([^"]+)"/,
      /<img[^>]+src="([^"]+)"[^>]+class="[^"]*generated[^"]*"/,
      /<img[^>]+class="[^"]*generated[^"]*"[^>]+src="([^"]+)"/
    ];

    let imageUrl = null;
    for (const pattern of patterns) {
      const match = htmlContent.match(pattern);
      if (match && match[1]) {
        imageUrl = match[1];
        break;
      }
    }
    
    if (!imageUrl) {
      console.error('Could not find image URL in response. HTML content:', htmlContent.substring(0, 500));
      return NextResponse.json(
        { error: 'Failed to generate image - no image URL found in response' },
        { status: 500 }
      );
    }

    const fullImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `https://www.desktophut.com${imageUrl}`;

    return NextResponse.json({ 
      image: fullImageUrl,
      success: true 
    });

  } catch (error) {
    console.error('Generation error:', error instanceof Error ? error.message : 'Unknown error');
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json(
          { error: 'Request timed out. Please try again.' },
          { status: 408 }
        );
      }
    }
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