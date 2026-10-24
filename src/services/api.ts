export const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

export const TOKEN_KEY = 'careplus-token'

export type ApiResponse<T> = {
  isSuccess: boolean
  respCode: number
  respMessage: string
  data: T | null
}

export type LoginResponse = {
  token: string
}

export type ChatResponse = {
  reply: string
  disclaimer: string
}

export function formatApiErrorDetails(data: unknown): string {
  if (Array.isArray(data)) {
    return data.filter(Boolean).map(String).join('; ')
  }

  if (data && typeof data === 'object') {
    return Object.entries(data)
      .flatMap(([field, messages]) => {
        const values = Array.isArray(messages) ? messages : [messages]
        return values.filter(Boolean).map((message) => `${field}: ${String(message)}`)
      })
      .join('; ')
  }

  return ''
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (requiresAuth) {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      throw new Error('Please login first.')
    }

    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const errorBody = body as { respMessage?: string; data?: unknown } | null
    const errorMessage = errorBody?.respMessage
    const errorDetails = formatApiErrorDetails(errorBody?.data)

    throw new Error(
      [errorMessage ?? `Request failed with status ${response.status}`, errorDetails]
        .filter(Boolean)
        .join(': '),
    )
  }

  return body as T
}


export const api = {
  async getHealth(): Promise<{ status: string }> {
    const response = await fetch(`${baseUrl}/api/health`)

    if (!response.ok) {
      throw new Error('API health check failed')
    }

    return response.json() as Promise<{ status: string }>
  },
  async sendChat(message: string): Promise<ChatResponse> {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error('Health guide request failed')
    }

    return response.json() as Promise<ChatResponse>
  },

  async getWithAuth<T>(path: string): Promise<T> {
    return request<T>(path, {}, true)
  },

}

