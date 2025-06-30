import { NextRequest, NextResponse } from 'next/server'
import { AIExplainRequest, AIExplainResponse } from '@/shared/types'

export async function POST(request: NextRequest) {
  try {
    const { code }: AIExplainRequest = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.HF_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // HuggingFace API call
    const response = await fetch(
      'https://api-inference.huggingface.co/models/bigcode/starcoder',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Explain this code in a clear and concise way:\n\n${code}`,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`)
    }

    const data = await response.json()
    let explanation = ''

    if (Array.isArray(data) && data.length > 0) {
      explanation = data[0].generated_text || 'Unable to generate explanation'
    } else {
      explanation = 'Unable to generate explanation'
    }

    // Clean up the explanation (remove the original prompt)
    const cleanExplanation = explanation
      .replace(`Explain this code in a clear and concise way:\n\n${code}`, '')
      .trim()

    const result: AIExplainResponse = {
      explanation: cleanExplanation || 'This code appears to be a programming snippet. Please provide more context for a detailed explanation.',
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI explain error:', error)
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
