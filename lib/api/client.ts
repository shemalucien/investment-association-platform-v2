// API client helper functions

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export class ApiError extends Error {
  status: number
  payload?: any

  constructor(message: string, status = 0, payload?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
    Object.setPrototypeOf(this, ApiError.prototype)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as ApiResponse<T>
  } catch (err) {
    return null
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' })
  const data = await parseApiResponse<T>(response)

  if (!response.ok || (data && !data.success)) {
    const message = data?.error || response.statusText || 'API request failed'
    const error = new Error(message) as any
    error.status = response.status || 0
    error.payload = data
    throw error
  }

  return (data?.data as T) ?? (null as any)
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await parseApiResponse<T>(response)

  if (!response.ok || (data && !data.success)) {
    const message = data?.error || response.statusText || 'API request failed'
    const error = new Error(message) as any
    error.status = response.status || 0
    error.payload = data
    throw error
  }

  return (data?.data as T) ?? (null as any)
}

export async function apiPatch<T>(url: string, body: any): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await parseApiResponse<T>(response)

  if (!response.ok || (data && !data.success)) {
    const message = data?.error || response.statusText || 'API request failed'
    const error = new Error(message) as any
    error.status = response.status || 0
    error.payload = data
    throw error
  }

  return (data?.data as T) ?? (null as any)
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  const data = await parseApiResponse<T>(response)

  if (!response.ok || (data && !data.success)) {
    const message = data?.error || response.statusText || 'API request failed'
    const error = new Error(message) as any
    error.status = response.status || 0
    error.payload = data
    throw error
  }

  return (data?.data as T) ?? (null as any)
}

export async function apiPut<T>(url: string, body: any): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await parseApiResponse<T>(response)

  if (!response.ok || (data && !data.success)) {
    const message = data?.error || response.statusText || 'API request failed'
    const error = new Error(message) as any
    error.status = response.status || 0
    error.payload = data
    throw error
  }

  return (data?.data as T) ?? (null as any)
}
