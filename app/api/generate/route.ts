import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { prompt, style, aspectRatio } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // First, make a request to get the CSRF token
    const csrfResponse = await axios.get('https://www.desktophut.com/page/free-ai-image-generator', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Extract CSRF token from the response
    const csrfToken = csrfResponse.data.match(/csrf-token" content="([^"]+)"/)?.[1];

    if (!csrfToken) {
      console.error('Failed to get CSRF token');
      return NextResponse.json(
        { error: 'Failed to initialize image generation' },
        { status: 500 }
      );
    }

    // Now make the actual generation request
    const response = await axios.post(
      'https://www.desktophut.com/api/generate',
      {
        prompt,
        style: style || 'Default',
        aspectRatio: aspectRatio || 'Default',
        width: 1024,
        height: 1024,
        enhancePrompt: true,
        privateImage: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Origin': 'https://www.desktophut.com',
          'Referer': 'https://www.desktophut.com/page/free-ai-image-generator',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (!response.data || !response.data.imageUrl) {
      console.error('No image URL in response:', response.data);
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      image: response.data.imageUrl,
      success: true 
    });

  } catch (error: any) {
    console.error('Generation error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Image generation failed. Please try again.' },
      { status: 500 }
    );
  }
} 