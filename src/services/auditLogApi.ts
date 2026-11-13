import { formatApiErrorDetails, request, type ApiResponse } from './api'

export type AuditAction = 'Create' | 'Update' | 'Delete'

export type AuditLogRecord = {
  logId: string
  userId: string
  actorName?: string | null
  actorUsername?: string | null
  actorRole?: string | null
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
}

function escapeCsvField(value: string): string {
  // Keep formula-like values as text when the CSV is opened in a spreadsheet.
  const text = /^(?:[\t\r\n]|\s*[=+\-@])/.test(value) ? "'" + value : value
  return '"' + text.replace(/"/g, '""') + '"'
}

export function createAuditLogCsv(records: readonly AuditLogRecord[]): Blob {
  const header = 'LogId,UserId,Action,Module,AffectedRecord,DateTime'
  const rows = records.map(({ logId, userId, action, module, affectedRecord, dateTime }) =>
    [logId, userId, action, module, affectedRecord, dateTime].map(escapeCsvField).join(','),
  )

  return new Blob([[header, ...rows].join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' })
}
