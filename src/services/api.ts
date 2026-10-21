export const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5156'

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
    const errorMessage = (body as { respMessage?: string } | null)?.respMessage

    throw new Error(
      errorMessage ?? `Request failed with status ${response.status}`,
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

