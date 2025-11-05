import { z } from 'zod'

// Zod schema matching OpenCode's webfetch tool
export const schema = z.object({
  url: z.string().describe('The URL to fetch content from'),
  format: z.enum(['text', 'markdown', 'html']).describe('The format to return the content in (text, markdown, or html)'),
  timeout: z.number().optional().describe('Optional timeout in seconds (max 120)')
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'webfetch',
    description: `Fetches content from a specified URL and processes it.

Usage:
- Takes a URL and format as input
- Fetches the URL content, converts HTML to markdown if needed
- Returns the content in the specified format
- Use this tool when you need to retrieve and analyze web content

Note: URL must be a fully-formed valid URL. HTTP URLs will be automatically upgraded to HTTPS.`,
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch content from'
        },
        format: {
          type: 'string',
          enum: ['text', 'markdown', 'html'],
          description: 'The format to return the content in (text, markdown, or html)'
        },
        timeout: {
          type: 'number',
          description: 'Optional timeout in seconds (max 120)'
        }
      },
      required: ['url', 'format'],
      additionalProperties: false
    }
  }
}

// Client-side execution function
export async function execute(args) {
  const validated = schema.parse(args)
  const { url, format, timeout = 30 } = validated

  // Validate URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'Error: URL must start with http:// or https://'
  }

  try {
    // Fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': format === 'html'
          ? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          : format === 'markdown'
          ? 'text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1'
          : 'text/plain;q=1.0, */*;q=0.1',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return `Error: Request failed with status code: ${response.status}`
    }

    // Check content length
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      return 'Error: Response too large (exceeds 5MB limit)'
    }

    const content = await response.text()

    if (content.length > 5 * 1024 * 1024) {
      return 'Error: Response too large (exceeds 5MB limit)'
    }

    const contentType = response.headers.get('content-type') || ''

    // For text client, we'll just return the content as-is
    // Real conversion (HTML to markdown) would require a library
    // For testing purposes, this is sufficient
    switch (format) {
      case 'markdown':
        if (contentType.includes('text/html')) {
          return `# Content from ${url}\n\n(HTML content - markdown conversion not available in test client)\n\n${content.substring(0, 10000)}...`
        }
        return content

      case 'text':
        if (contentType.includes('text/html')) {
          // Simple HTML stripping
          const stripped = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                                  .replace(/<[^>]+>/g, ' ')
                                  .replace(/\s+/g, ' ')
                                  .trim()
          return stripped.substring(0, 10000)
        }
        return content

      case 'html':
        return content

      default:
        return content
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return `Error: Request timed out after ${timeout} seconds`
    }
    return `Error: ${error.message}`
  }
}
