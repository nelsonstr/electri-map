import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type OperationType =
  | 'alert_dispatch'
  | 'notification_send'
  | 'user_update'
  | 'data_export'
  | 'data_import'
  | 'report_generation'
  | 'bulk_delete'
  | 'bulk_status_update'

export type BatchItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'

export interface BatchOperation {
  id: string
  name: string
  description?: string
  operationType: OperationType
  status: BatchStatus
  
  // Configuration
  config: {
    filters?: Record<string, unknown>
    operations?: Array<{
      field: string
      value: unknown
      operator: 'set' | 'increment' | 'decrement' | 'append' | 'remove'
    }>
    customLogic?: string
  }
  
  // Progress
  totalItems: number
  processedItems: number
  successfulItems: number
  failedItems: number
  skippedItems: number
  
  // Timing
  startedAt?: string
  completedAt?: string
  estimatedTimeRemaining?: number // seconds
  
  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Results summary
  results?: BatchOperationResult
}

export interface BatchOperationResult {
  summary: Record<string, unknown>
  affectedIds: string[]
  errors: Array<{
    itemId: string
    error: string
  }>
}

export interface BatchItem {
  id: string
  batchId: string
  itemId: string
  itemData: Record<string, unknown>
  status: BatchItemStatus
  result?: Record<string, unknown>
  error?: string
  processedAt?: string
}

export interface CreateBatchInput {
  name: string
  description?: string
  operationType: OperationType
  itemIds: string[]
  config?: BatchOperation['config']
}

export interface BatchFilters {
  status?: BatchStatus
  operationType?: OperationType
  createdBy?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createBatchSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  operationType: z.enum([
    'alert_dispatch',
    'notification_send',
    'user_update',
    'data_export',
    'data_import',
    'report_generation',
    'bulk_delete',
    'bulk_status_update',
  ]),
  itemIds: z.array(z.string()).min(1).max(10000),
  config: z.object({
    filters: z.record(z.unknown()).optional(),
    operations: z.array(z.object({
      field: z.string(),
      value: z.unknown(),
      operator: z.enum(['set', 'increment', 'decrement', 'append', 'remove']),
    })).optional(),
    customLogic: z.string().optional(),
  }).optional(),
})

export const batchOperationSchema = z.object({
  field: z.string(),
  value: z.unknown(),
  operator: z.enum(['set', 'increment', 'decrement', 'append', 'remove']),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getBatchStatusDisplayName(status: BatchStatus): string {
  const names: Record<BatchStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  }
  return names[status]
}

export function getOperationTypeDisplayName(type: OperationType): string {
  const names: Record<OperationType, string> = {
    alert_dispatch: 'Alert Dispatch',
    notification_send: 'Notification Send',
    user_update: 'User Update',
    data_export: 'Data Export',
    data_import: 'Data Import',
    report_generation: 'Report Generation',
    bulk_delete: 'Bulk Delete',
    bulk_status_update: 'Bulk Status Update',
  }
  return names[type]
}

export function getBatchItemStatusDisplayName(status: BatchItemStatus): string {
  const names: Record<BatchItemStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    skipped: 'Skipped',
  }
  return names[status]
}

export function calculateBatchProgress(operation: BatchOperation): number {
  if (operation.totalItems === 0) return 100
  return Math.round((operation.processedItems / operation.totalItems) * 100)
}

export function estimateBatchCompletionTime(
  operation: BatchOperation
): number {
  if (operation.processedItems === 0) return -1
  
  const elapsedSeconds = operation.startedAt
    ? (Date.now() - new Date(operation.startedAt).getTime()) / 1000
    : 0
  
  const avgTimePerItem = elapsedSeconds / operation.processedItems
  const remainingItems = operation.totalItems - operation.processedItems
  
  return Math.round(avgTimePerItem * remainingItems)
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createBatch(
  userId: string,
  input: CreateBatchInput
): Promise<BatchOperation> {
  const validationResult = createBatchSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const operation: BatchOperation = {
    id,
    name: input.name,
    description: input.description,
    operationType: input.operationType,
    status: 'pending',
    config: input.config || {},
    totalItems: input.itemIds.length,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    skippedItems: 0,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('batch_operations')
    .insert({
      id,
      name: input.name,
      description: input.description,
      operation_type: input.operationType,
      status: 'pending',
      config: input.config || {},
      total_items: input.itemIds.length,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      skipped_items: 0,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating batch operation:', error)
    throw new Error('Failed to create batch operation')
  }

  // Create batch items
  const items: BatchItem[] = input.itemIds.map(itemId => ({
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    batchId: id,
    itemId,
    itemData: {},
    status: 'pending',
  }))

  const { error: itemsError } = await supabase
    .from('batch_items')
    .insert(items.map(item => ({
      id: item.id,
      batch_id: item.batchId,
      item_id: item.itemId,
      item_data: item.itemData,
      status: 'pending',
    })))

  if (itemsError) {
    console.error('Error creating batch items:', itemsError)
  }

  return mapBatchOperationFromDB(data)
}

export async function getBatchOperation(
  batchId: string
): Promise<BatchOperation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('batch_operations')
    .select('*')
    .eq('id', batchId)
    .single()

  if (error || !data) {
    return null
  }

  return mapBatchOperationFromDB(data)
}

export async function getBatchOperations(
  filters?: BatchFilters
): Promise<BatchOperation[]> {
  const supabase = createClient()

  let query = supabase
    .from('batch_operations')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.operationType) {
    query = query.eq('operation_type', filters.operationType)
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
    console.error('Error fetching batch operations:', error)
    return []
  }

  return (data || []).map(mapBatchOperationFromDB)
}

export async function startBatchOperation(batchId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('batch_operations')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId)

  if (error) {
    console.error('Error starting batch operation:', error)
    throw new Error('Failed to start batch operation')
  }
}

export async function updateBatchProgress(
  batchId: string,
  processedItems: number,
  successfulItems: number,
  failedItems: number,
  skippedItems: number
): Promise<void> {
  const supabase = createClient()

  const estimatedTime = estimateBatchCompletionTime({
    id: batchId,
    totalItems: 0,
    processedItems,
    successfulItems,
    failedItems,
    skippedItems,
    startedAt: new Date().toISOString(),
  } as BatchOperation)

  const { error } = await supabase
    .from('batch_operations')
    .update({
      processed_items: processedItems,
      successful_items: successfulItems,
      failed_items: failedItems,
      skipped_items: skippedItems,
      estimated_time_remaining: estimatedTime > 0 ? estimatedTime : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId)

  if (error) {
    console.error('Error updating batch progress:', error)
  }
}

export async function completeBatchOperation(
  batchId: string,
  result?: BatchOperationResult
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('batch_operations')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      results: result,
      estimated_time_remaining: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId)

  if (error) {
    console.error('Error completing batch operation:', error)
    throw new Error('Failed to complete batch operation')
  }
}

export async function failBatchOperation(
  batchId: string,
  error: string
): Promise<void> {
  const supabase = createClient()

  const { error: updateError } = await supabase
    .from('batch_operations')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      results: {
        errors: [{ itemId: 'batch', error }],
      },
      estimated_time_remaining: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId)

  if (updateError) {
    console.error('Error failing batch operation:', updateError)
  }
}

export async function cancelBatchOperation(batchId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('batch_operations')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId)

  if (error) {
    console.error('Error cancelling batch operation:', error)
    throw new Error('Failed to cancel batch operation')
  }
}

export async function getBatchItems(
  batchId: string,
  status?: BatchItemStatus,
  limit: number = 100
): Promise<BatchItem[]> {
  const supabase = createClient()

  let query = supabase
    .from('batch_items')
    .select('*')
    .eq('batch_id', batchId)
    .order('id', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  query = query.limit(limit)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching batch items:', error)
    return []
  }

  return (data || []).map(mapBatchItemFromDB)
}

export async function updateBatchItem(
  itemId: string,
  status: BatchItemStatus,
  result?: Record<string, unknown>,
  error?: string
): Promise<void> {
  const supabase = createClient()

  const { updateError } = await supabase
    .from('batch_items')
    .update({
      status,
      result,
      error,
      processed_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (updateError) {
    console.error('Error updating batch item:', updateError)
  }
}

export async function processBatchItems(
  batchId: string,
  processor: (item: BatchItem) => Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }>
): Promise<void> {
  const batch = await getBatchOperation(batchId)
  if (!batch) {
    throw new Error('Batch operation not found')
  }

  await startBatchOperation(batchId)

  const items = await getBatchItems(batchId, 'pending', 100)
  let processed = 0
  let successful = 0
  let failed = 0
  let skipped = 0

  for (const item of items) {
    try {
      const result = await processor(item)
      
      if (result.success) {
        await updateBatchItem(item.id, 'completed', result.result)
        successful++
      } else {
        await updateBatchItem(item.id, 'failed', undefined, result.error)
        failed++
      }
    } catch (e) {
      await updateBatchItem(item.id, 'failed', undefined, (e as Error).message)
      failed++
    }

    processed++
    await updateBatchProgress(batchId, processed, successful, failed, skipped)
  }

  // Check if there are more items
  const remainingItems = await getBatchItems(batchId, 'pending')
  if (remainingItems.length > 0) {
    // Schedule next batch processing
    await processBatchItems(batchId, processor)
  } else {
    await completeBatchOperation(batchId)
  }
}

export async function retryBatchOperation(
  batchId: string,
  userId: string
): Promise<BatchOperation> {
  const original = await getBatchOperation(batchId)
  if (!original) {
    throw new Error('Batch operation not found')
  }

  // Get failed items
  const failedItems = await getBatchItems(batchId, 'failed')
  const itemIds = failedItems.map(item => item.itemId)

  if (itemIds.length === 0) {
    throw new Error('No failed items to retry')
  }

  return createBatch(userId, {
    name: `${original.name} (Retry)`,
    description: `Retry of failed items from batch ${batchId}`,
    operationType: original.operationType,
    itemIds,
    config: original.config,
  })
}

export async function getBatchStatistics(
  userId?: string
): Promise<{
  totalOperations: number
  pendingOperations: number
  processingOperations: number
  completedOperations: number
  failedOperations: number
  averageSuccessRate: number
  totalItemsProcessed: number
}>> {
  const supabase = createClient()

  let query = supabase.from('batch_operations').select('*')
  
  if (userId) {
    query = query.eq('created_by', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching batch statistics:', error)
    return {
      totalOperations: 0,
      pendingOperations: 0,
      processingOperations: 0,
      completedOperations: 0,
      failedOperations: 0,
      averageSuccessRate: 0,
      totalItemsProcessed: 0,
    }
  }

  const operations = data || []
  const completedOps = operations.filter(op => op.status === 'completed')
  
  const totalProcessed = operations.reduce((sum, op) => sum + (op.successful_items || 0), 0)
  const totalFailed = operations.reduce((sum, op) => sum + (op.failed_items || 0), 0)

  return {
    totalOperations: operations.length,
    pendingOperations: operations.filter(op => op.status === 'pending').length,
    processingOperations: operations.filter(op => op.status === 'processing').length,
    completedOperations: completedOps.length,
    failedOperations: operations.filter(op => op.status === 'failed').length,
    averageSuccessRate: totalProcessed + totalFailed > 0
      ? Math.round((totalProcessed / (totalProcessed + totalFailed)) * 100)
      : 0,
    totalItemsProcessed: totalProcessed,
  }
}

// ============================================================================
// Specific Batch Processors
// ============================================================================

export async function processAlertDispatch(
  batchId: string,
  alertConfig: {
    type: string
    severity: string
    title: string
    message: string
  }
): Promise<void> {
  await processBatchItems(batchId, async (item) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase.from('alerts').insert({
        id: item.itemId,
        type: alertConfig.type,
        severity: alertConfig.severity,
        title: alertConfig.title,
        message: alertConfig.message,
        status: 'sent',
        created_at: new Date().toISOString(),
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  })
}

export async function processBulkStatusUpdate(
  batchId: string,
  updates: Array<{
    field: string
    value: unknown
    operator: 'set' | 'increment' | 'decrement'
  }>
): Promise<void> {
  await processBatchItems(batchId, async (item) => {
    const supabase = createClient()
    
    try {
      const updateData: Record<string, unknown> = {}
      
      for (const update of updates) {
        switch (update.operator) {
          case 'set':
            updateData[update.field] = update.value
            break
          case 'increment':
            updateData[update.field] = (item.itemData[update.field] as number || 0) + (update.value as number)
            break
          case 'decrement':
            updateData[update.field] = (item.itemData[update.field] as number || 0) - (update.value as number)
            break
        }
      }

      const { error } = await supabase
        .from(item.itemData._table as string || 'items')
        .update(updateData)
        .eq('id', item.itemId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapBatchOperationFromDB(data: Record<string, unknown>): BatchOperation {
  return {
    id: data.id,
    name: data.name,
    description: data.description as string | undefined,
    operationType: data.operation_type as OperationType,
    status: data.status as BatchStatus,
    config: (data.config as Record<string, unknown>) || {},
    totalItems: data.total_items,
    processedItems: data.processed_items,
    successfulItems: data.successful_items,
    failedItems: data.failed_items,
    skippedItems: data.skipped_items,
    startedAt: data.started_at as string | undefined,
    completedAt: data.completed_at as string | undefined,
    estimatedTimeRemaining: data.estimated_time_remaining as number | undefined,
    createdBy: data.created_by,
    results: data.results as BatchOperationResult | undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function mapBatchItemFromDB(data: Record<string, unknown>): BatchItem {
  return {
    id: data.id,
    batchId: data.batch_id,
    itemId: data.item_id,
    itemData: (data.item_data as Record<string, unknown>) || {},
    status: data.status as BatchItemStatus,
    result: data.result as Record<string, unknown> | undefined,
    error: data.error as string | undefined,
    processedAt: data.processed_at as string | undefined,
  }
}
