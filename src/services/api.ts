export const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

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
  sources: Array<{
    title: string
    source: string
    score: number
  }>
}

export type ChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type StoredChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
  disclaimer?: string | null
  sources?: ChatResponse['sources'] | null
}

export type StoredChatThread = {
  id: string
  title: string
  updatedAt: number
  messages: StoredChatMessage[]
}

export class ApiRequestError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
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

export function messageFromBody(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") {
    return fallback
  }

  const record = body as { respMessage?: string; message?: string; title?: string; detail?: string; data?: unknown }
  if (Array.isArray(record.data)) {
    const lines = record.data.filter((item): item is string => typeof item === "string" && item.length > 0)
    if (lines.length > 0) {
      return lines.join("\n")
    }
  }

  return record.respMessage || record.message || record.detail || record.title || fallback
}

function messageFromHttpStatus(status: number) {
  if (status === 401) return 'Your session has expired or is invalid. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested appointment could not be found.'
  if (status === 405) return 'This action is not supported by the server.'
  return `Request failed with status ${status}`
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
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
    const code = body && typeof body === 'object' && 'reason' in body && typeof body.reason === 'string'
      ? body.reason
      : undefined
    throw new ApiRequestError(messageFromBody(body, `Request failed with status ${response.status}`), response.status, code)
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
  async sendChat(message: string, history: ChatTurn[] = []): Promise<ChatResponse> {
    return request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    })
  },

  async getChatThreads(): Promise<StoredChatThread[]> {
    return request<StoredChatThread[]>('/api/chat/threads', {}, true)
  },

  async sendStoredChat(message: string, threadId?: string): Promise<StoredChatThread> {
    return request<StoredChatThread>('/api/chat/threads/messages', {
      method: 'POST',
      body: JSON.stringify({ message, threadId }),
    }, true)
  },

  async deleteChatThreads(threadIds: string[]): Promise<{ deleted: number }> {
    return request<{ deleted: number }>('/api/chat/threads', {
      method: 'DELETE',
      body: JSON.stringify({ threadIds }),
    }, true)
  },

  async getWithAuth<T>(path: string): Promise<T> {
    return request<T>(path, {}, true)
  },

}

