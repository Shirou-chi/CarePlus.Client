import { formatApiErrorDetails, request, TOKEN_KEY, baseUrl, type ApiResponse } from './api'

export type AuditAction = 'Create' | 'Update' | 'Delete'

export type AuditLogRecord = {
  logId: string
  userId: string
  action: AuditAction | string
  module: string
  affectedRecord: string
  dateTime: string
}

async function unwrap<T>(result: ApiResponse<T>, fallback: string): Promise<T> {
  if (!result.isSuccess || result.data === null) {
    const details = formatApiErrorDetails(result.data)
    throw new Error([result.respMessage || fallback, details].filter(Boolean).join(': '))
  }

  return result.data
}

export const auditLogApi = {
  async retrieve(pageSize = 500): Promise<AuditLogRecord[]> {
    const result = await request<ApiResponse<AuditLogRecord[]>>(
      `/api/AuditLog/Retrieve?pageSize=${pageSize}`,
      {},
      true,
    )

    return unwrap(result, 'Unable to load audit logs.')
  },

  async retrieveById(logId: string): Promise<AuditLogRecord> {
    const result = await request<ApiResponse<AuditLogRecord>>(
      `/api/AuditLog/RetrieveById/${encodeURIComponent(logId)}`,
      {},
      true,
    )

    return unwrap(result, 'Unable to load audit-log details.')
  },

  async exportCsv(): Promise<Blob> {
    const token = localStorage.getItem(TOKEN_KEY)
    const response = await fetch(`${baseUrl}/api/AuditLog/Export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })

    if (!response.ok) {
      throw new Error(`Unable to export audit logs (status ${response.status}).`)
    }

    return response.blob()
  },
}
