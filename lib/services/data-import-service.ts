import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type ImportType =
  | 'users'
  | 'locations'
  | 'outages'
  | 'restorations'
  | 'alerts'
  | 'boundaries'
  | 'custom'

export type ImportFormat = 'csv' | 'json' | 'xlsx' | 'xml'

export type ImportConflictResolution = 'skip' | 'update' | 'merge'

export interface DataImport {
  id: string
  name: string
  description?: string
  importType: ImportType
  status: ImportStatus
  format: ImportFormat
  
  // File Information
  fileName: string
  fileSize: number
  fileUrl?: string
  
  // Configuration
  config: {
    hasHeader: boolean
    delimiter?: string
    encoding?: string
    conflictResolution: ImportConflictResolution
    fieldMappings?: Record<string, string>
    transformations?: Array<{
      field: string
      type: 'uppercase' | 'lowercase' | 'trim' | 'date_format' | 'custom'
      params?: Record<string, unknown>
    }>
  }
  
  // Validation
  validatedRows: number
  invalidRows: number
  validationErrors: Array<{
    row: number
    field: string
    error: string
  }>
  
  // Progress
  totalRows: number
  processedRows: number
  successfulRows: number
  failedRows: number
  
  // Timing
  startedAt?: string
  completedAt?: string
  
  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Results
  results?: ImportResult
}

export interface ImportResult {
  summary: Record<string, unknown>
  affectedIds: string[]
  errors: Array<{
    row: number
    error: string
  }>
  preview?: Array<Record<string, unknown>>
}

export interface ImportPreview {
  headers: string[]
  rows: Array<Record<string, unknown>>
  totalRows: number
  sampleErrors: Array<{
    row: number
    field: string
    error: string
  }>
}

export interface CreateImportInput {
  name: string
  description?: string
  importType: ImportType
  format: ImportFormat
  fileName: string
  fileSize: number
  config: DataImport['config']
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createImportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  importType: z.enum([
    'users',
    'locations',
    'outages',
    'restorations',
    'alerts',
    'boundaries',
    'custom',
  ]),
  format: z.enum(['csv', 'json', 'xlsx', 'xml']),
  fileName: z.string(),
  fileSize: z.number().positive(),
  config: z.object({
    hasHeader: z.boolean().default(true),
    delimiter: z.string().optional(),
    encoding: z.string().optional(),
    conflictResolution: z.enum(['skip', 'update', 'merge']).default('skip'),
    fieldMappings: z.record(z.string()).optional(),
    transformations: z.array(z.object({
      field: z.string(),
      type: z.enum(['uppercase', 'lowercase', 'trim', 'date_format', 'custom']),
      params: z.record(z.unknown()).optional(),
    })).optional(),
  }),
})

export const fieldMappingSchema = z.object({
  sourceField: z.string(),
  targetField: z.string(),
  required: z.boolean().default(false),
  transform: z.enum(['none', 'uppercase', 'lowercase', 'trim', 'date_format', 'custom']).default('none'),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getImportStatusDisplayName(status: ImportStatus): string {
  const names: Record<ImportStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  }
  return names[status]
}

export function getImportTypeDisplayName(type: ImportType): string {
  const names: Record<ImportType, string> = {
    users: 'Users',
    locations: 'Locations',
    outages: 'Outages',
    restorations: 'Restorations',
    alerts: 'Alerts',
    boundaries: 'Boundaries',
    custom: 'Custom Data',
  }
  return names[type]
}

export function getImportFormatDisplayName(format: ImportFormat): string {
  const names: Record<ImportFormat, string> = {
    csv: 'CSV',
    json: 'JSON',
    xlsx: 'Excel',
    xml: 'XML',
  }
  return names[typeof format === 'string' ? format : 'csv']
}

export function getConflictResolutionDisplayName(resolution: ImportConflictResolution): string {
  const names: Record<ImportConflictResolution, string> = {
    skip: 'Skip Duplicates',
    update: 'Update Existing',
    merge: 'Merge Records',
  }
  return names[resolution]
}

export function calculateImportProgress(importData: DataImport): number {
  if (importData.totalRows === 0) return 100
  return Math.round((importData.processedRows / importData.totalRows) * 100)
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createImport(
  userId: string,
  input: CreateImportInput
): Promise<DataImport> {
  const validationResult = createImportSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const id = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const dataImport: DataImport = {
    id,
    name: input.name,
    description: input.description,
    importType: input.importType,
    status: 'pending',
    format: input.format,
    fileName: input.fileName,
    fileSize: input.fileSize,
    config: input.config,
    validatedRows: 0,
    invalidRows: 0,
    validationErrors: [],
    totalRows: 0,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('data_imports')
    .insert({
      id,
      name: input.name,
      description: input.description,
      import_type: input.importType,
      status: 'pending',
      format: input.format,
      file_name: input.fileName,
      file_size: input.fileSize,
      config: input.config,
      validated_rows: 0,
      invalid_rows: 0,
      validation_errors: [],
      total_rows: 0,
      processed_rows: 0,
      successful_rows: 0,
      failed_rows: 0,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating import:', error)
    throw new Error('Failed to create import')
  }

  return mapDataImportFromDB(data)
}

export async function getImport(importId: string): Promise<DataImport | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('data_imports')
    .select('*')
    .eq('id', importId)
    .single()

  if (error || !data) {
    return null
  }

  return mapDataImportFromDB(data)
}

export async function getImports(
  filters?: {
    status?: ImportStatus
    importType?: ImportType
    createdBy?: string
    fromDate?: string
    toDate?: string
    limit?: number
    offset?: number
  }
): Promise<DataImport[]> {
  const supabase = createClient()

  let query = supabase
    .from('data_imports')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.importType) {
    query = query.eq('import_type', filters.importType)
  }

  if (filters?.createdBy) {
    query = query.eq('created_by', filters.createdBy)
  }

  if (filters?.fromDate) {
    query = query.gte('created_at', filters.fromDate)
  }

  if (filters?.toDate) {
    query = query.lte('created_at', filters.toDate)
  }

  query = query
    .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching imports:', error)
    return []
  }

  return (data || []).map(mapDataImportFromDB)
}

export async function validateImportData(
  importId: string,
  data: Array<Record<string, unknown>>
): Promise<{
  valid: boolean
  validatedRows: number
  invalidRows: number
  errors: Array<{ row: number; field: string; error: string }>
}> {
  const dataImport = await getImport(importId)
  if (!dataImport) {
    throw new Error('Import not found')
  }

  const errors: Array<{ row: number; field: string; error: string }> = []
  let invalidRows = 0

  for (let i = 0; i < data.length as number; i++) {
    const row = data[i]
    const rowNum = i + 1
    
    // Apply field mappings
    const mappedRow = applyFieldMappings(row, dataImport.config.fieldMappings)
    
    // Validate required fields
    const validationResult = validateRow(mappedRow, dataImport.importType)
    if (!validationResult.valid) {
      invalidRows++
      errors.push(...validationResult.errors.map(e => ({
        row: rowNum,
        field: e.field,
        error: e.error,
      })))
    }
  }

  const supabase = createClient()
  
  await supabase
    .from('data_imports')
    .update({
      validated_rows: data.length as number - invalidRows,
      invalid_rows: invalidRows,
      validation_errors: errors.slice(0, 100), // Limit stored errors
      total_rows: data.length as number,
      updated_at: new Date().toISOString(),
    })
    .eq('id', importId)

  return {
    valid: invalidRows === 0,
    validatedRows: data.length as number - invalidRows,
    invalidRows,
    errors,
  }
}

export async function startImport(importId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('data_imports')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', importId)

  if (error) {
    console.error('Error starting import:', error)
    throw new Error('Failed to start import')
  }
}

export async function updateImportProgress(
  importId: string,
  processedRows: number,
  successfulRows: number,
  failedRows: number
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('data_imports')
    .update({
      processed_rows: processedRows,
      successful_rows: successfulRows,
      failed_rows: failedRows,
      updated_at: new Date().toISOString(),
    })
    .eq('id', importId)
}

export async function completeImport(
  importId: string,
  result?: ImportResult
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('data_imports')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      results: result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', importId)
}

export async function failImport(
  importId: string,
  error: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('data_imports')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      results: {
        errors: [{ row: 0, error }],
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', importId)
}

export async function cancelImport(importId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('data_imports')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', importId)
}

export async function processImport(
  importId: string,
  processor: (row: Record<string, unknown>) => Promise<{ success: boolean; id?: string; error?: string }>
): Promise<void> {
  const dataImport = await getImport(importId)
  if (!dataImport) {
    throw new Error('Import not found')
  }

  await startImport(importId)

  // In production, this would fetch data from file storage
  const data: Array<Record<string, unknown>> = []
  
  let processed = 0
  let successful = 0
  let failed = 0

  for (const row of data) {
    try {
      // Apply transformations
      const transformedRow = applyTransformations(row, dataImport.config.transformations)
      
      // Process the row
      const result = await processor(transformedRow)
      
      if (result.success) {
        successful++
      } else {
        failed++
        // Log error
        await logImportError(importId, processed + 1, result.error || 'Unknown error')
      }
    } catch (e) {
      failed++
      await logImportError(importId, processed + 1, (e as Error).message)
    }

    processed++
    await updateImportProgress(importId, processed, successful, failed)
  }

  await completeImport(importId, {
    summary: {
      totalRows: processed,
      successfulRows: successful,
      failedRows: failed,
    },
    affectedIds: [],
    errors: [],
  })
}

export async function previewImportData(
  importId: string,
  limit: number = 10
): Promise<ImportPreview | null> {
  const dataImport = await getImport(importId)
  if (!dataImport) {
    return null
  }

  // In production, this would fetch from file storage
  const data: Array<Record<string, unknown>> = []
  
  if (data.length as number === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      sampleErrors: [],
    }
  }

  const headers = Object.keys(data[0])
  const sampleErrors = dataImport.validationErrors.slice(0, 10)

  return {
    headers,
    rows: data.slice(0, limit),
    totalRows: data.length as number,
    sampleErrors,
  }
}

export async function getImportStatistics(
  userId?: string
): Promise<{
  totalImports: number
  pendingImports: number
  processingImports: number
  completedImports: number
  failedImports: number
  totalRowsImported: number
  successRate: number
}> {
  const supabase = createClient()

  let query = supabase.from('data_imports').select('*')
  
  if (userId) {
    query = query.eq('created_by', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching import statistics:', error)
    return {
      totalImports: 0,
      pendingImports: 0,
      processingImports: 0,
      completedImports: 0,
      failedImports: 0,
      totalRowsImported: 0,
      successRate: 0,
    }
  }

  const imports = data || []
  const completed = imports.filter(i => i.status === 'completed')
  const failed = imports.filter(i => i.status === 'failed')
  
  const totalSuccessful = completed.reduce((sum, i) => sum + (i.successful_rows || 0), 0)
  const totalFailed = completed.reduce((sum, i) => sum + (i.failed_rows || 0), 0)

  return {
    totalImports: imports.length,
    pendingImports: imports.filter(i => i.status === 'pending').length,
    processingImports: imports.filter(i => i.status === 'processing').length,
    completedImports: completed.length,
    failedImports: failed.length,
    totalRowsImported: totalSuccessful,
    successRate: totalSuccessful + totalFailed > 0
      ? Math.round((totalSuccessful / (totalSuccessful + totalFailed)) * 100)
      : 0,
  }
}

// ============================================================================
// Import Processors
// ============================================================================

export async function importUsers(
  importId: string,
  data: Array<Record<string, unknown>>
): Promise<void> {
  await processImport(importId, async (row) => {
    const supabase = createClient()
    
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', row.email)
      .single()

    if (existing) {
      switch (row.config?.conflictResolution) {
        case 'skip':
          return { success: true }
        case 'update':
          await supabase
            .from('users')
            .update(row)
            .eq('id', existing.id)
          return { success: true, id: existing.id }
        case 'merge':
          return { success: true }
      }
    }

    const { error } = await supabase
      .from('users')
      .insert({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: row.email,
        name: row.name,
        phone: row.phone,
        role: row.role || 'user',
        status: 'active',
        created_at: new Date().toISOString(),
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  })
}

export async function importLocations(
  importId: string,
  data: Array<Record<string, unknown>>
): Promise<void> {
  await processImport(importId, async (row) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('locations')
      .insert({
        id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: row.name,
        address: row.address,
        latitude: parseFloat(row.latitude as string),
        longitude: parseFloat(row.longitude as string),
        type: row.type || 'user_location',
        created_at: new Date().toISOString(),
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  })
}

export async function importOutages(
  importId: string,
  data: Array<Record<string, unknown>>
): Promise<void> {
  await processImport(importId, async (row) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('power_outages')
      .insert({
        id: `outage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        location_id: row.location_id,
        status: row.status || 'active',
        severity: row.severity || 'medium',
        affected_customers: parseInt(row.affected_customers as string) || 0,
        cause: row.cause,
        estimated_restoration: row.estimated_restoration,
        created_at: new Date().toISOString(),
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

function applyFieldMappings(
  row: Record<string, unknown>,
  mappings?: Record<string, string>
): Record<string, unknown> {
  if (!mappings) return row
  
  const result: Record<string, unknown> = {}
  
  for (const [source, target] of Object.entries(mappings)) {
    if (row[source] !== undefined) {
      result[target] = row[source]
    }
  }
  
  return result
}

function applyTransformations(
  row: Record<string, unknown>,
  transformations?: Array<{
    field: string
    type: 'uppercase' | 'lowercase' | 'trim' | 'date_format' | 'custom'
    params?: Record<string, unknown>
  }>
): Record<string, unknown> {
  if (!transformations) return row
  
  const result = { ...row }
  
  for (const transform of transformations) {
    if (result[transform.field] !== undefined) {
      const value = String(result[transform.field])
      
      switch (transform.type) {
        case 'uppercase':
          result[transform.field] = value.toUpperCase()
          break
        case 'lowercase':
          result[transform.field] = value.toLowerCase()
          break
        case 'trim':
          result[transform.field] = value.trim()
          break
        case 'date_format':
          // Handle date formatting
          result[transform.field] = value
          break
      }
    }
  }
  
  return result
}

function validateRow(
  row: Record<string, unknown>,
  importType: ImportType
): { valid: boolean; errors: Array<{ field: string; error: string }> } {
  const errors: Array<{ field: string; error: string }> = []
  
  switch (importType) {
    case 'users':
      if (!row.email) {
        errors.push({ field: 'email', error: 'Email is required' })
      }
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email as string)) {
        errors.push({ field: 'email', error: 'Invalid email format' })
      }
      break
      
    case 'locations':
      if (!row.latitude || row.latitude === '') {
        errors.push({ field: 'latitude', error: 'Latitude is required' })
      }
      if (!row.longitude || row.longitude === '') {
        errors.push({ field: 'longitude', error: 'Longitude is required' })
      }
      break
      
    case 'outages':
      if (!row.location_id) {
        errors.push({ field: 'location_id', error: 'Location ID is required' })
      }
      break
  }
  
  return { valid: errors.length === 0, errors }
}

async function logImportError(
  importId: string,
  row: number,
  error: string
): Promise<void> {
  const supabase = createClient()
  
  await supabase
    .from('data_import_errors')
    .insert({
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      import_id: importId,
      row_number: row,
      error_message: error,
      created_at: new Date().toISOString(),
    })
}

function mapDataImportFromDB(data: Record<string, unknown>): DataImport {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    importType: data.import_type as ImportType,
    status: data.status as ImportStatus,
    format: data.format as ImportFormat,
    fileName: data.file_name as string,
    fileSize: data.file_size as number,
    config: data.config as DataImport['config'],
    validatedRows: data.validated_rows,
    invalidRows: data.invalid_rows,
    validationErrors: (data.validation_errors as Array<{ row: number; field: string; error: string }>) || [],
    totalRows: data.total_rows,
    processedRows: data.processed_rows,
    successfulRows: data.successful_rows,
    failedRows: data.failed_rows,
    startedAt: data.started_at as string | undefined,
    completedAt: data.completed_at as string | undefined,
    createdBy: data.created_by,
    results: data.results as ImportResult | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
