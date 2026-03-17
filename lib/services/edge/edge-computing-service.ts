/**
 * Edge Computing for Offline Operations Service
 * 
 * Epic: Edge Computing for Offline Operations
 * Description: Edge computing architecture for offline-first emergency response operations,
 * including local data caching, mesh networking, offline map tiles, edge ML inference,
 * conflict resolution, and synchronization strategies.
 * 
 * Bmad Category: Resilient Infrastructure (RI)
 * Emergency Mode Relevance: BFSI, CPI, SAR, MAC - Essential for operations in degraded network conditions
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type SyncStatus = 
  | 'synced'
  | 'pending_upload'
  | 'pending_download'
  | 'conflict'
  | 'error'
  | 'offline';

export type ConflictResolutionStrategy = 
  | 'server_wins'
  | 'client_wins'
  | 'newest_wins'
  | 'oldest_wins'
  | 'merge'
  | 'manual';

export type ConflictType = 
  | 'data_updated'
  | 'data_deleted'
  | 'duplicate_created'
  | 'constraint_violation'
  | 'schema_mismatch';

export type NodeType = 
  | 'mobile'
  | 'tablet'
  | 'vehicle'
  | 'base_station'
  | 'gateway'
  | 'server'
  | 'drone';

export type ConnectionType = 
  | 'wifi'
  | 'cellular'
  | 'satellite'
  | 'bluetooth'
  | 'wifi_direct'
  | 'mesh'
  | 'wired'
  | 'none';

export type MeshNodeRole = 
  | 'client'
  | 'relay'
  | 'gateway'
  | 'coordinator';

export interface OfflineData {
  id: string;
  data_id: string;
  entity_type: string;
  data: Record<string, unknown>;
  version: number;
  checksum: string;
  created_at: Date;
  updated_at: Date;
  last_synced_at?: Date;
  sync_status: SyncStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expires_at?: Date;
  metadata?: Record<string, unknown>;
}

export interface DataSyncQueue {
  id: string;
  queue_id: string;
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data?: Record<string, unknown>;
  priority: number;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  processing_at?: Date;
  completed_at?: Date;
  error?: string;
}

export interface ConflictRecord {
  id: string;
  conflict_id: string;
  entity_type: string;
  entity_id: string;
  local_version: Record<string, unknown>;
  server_version: Record<string, unknown>;
  merged_version?: Record<string, unknown>;
  resolution?: ConflictResolutionStrategy;
  resolved_at?: Date;
  resolved_by?: string;
  status: 'pending' | 'resolved' | 'escalated';
  created_at: Date;
  conflict_type: ConflictType;
  reason: string;
}

export interface MeshNetwork {
  id: string;
  network_id: string;
  name: string;
  network_key: string;
  created_at: Date;
  last_activity: Date;
  node_count: number;
  max_nodes: number;
  status: 'active' | 'inactive' | 'maintenance';
  configuration: {
    channel: number;
    band: '2.4ghz' | '5ghz' | '6ghz';
    encryption: string;
    max_hops: number;
    gateway_mode: boolean;
  };
}

export interface MeshNode {
  id: string;
  node_id: string;
  network_id: string;
  device_id: string;
  name: string;
  type: NodeType;
  role: MeshNodeRole;
  status: 'online' | 'offline' | 'degraded';
  last_seen: Date;
  battery_level?: number;
  signal_strength?: number;
  connection_type: ConnectionType;
  ip_address?: string;
  mac_address?: string;
  capabilities: string[];
  resources: {
    cpu_cores: number;
    cpu_usage_percent: number;
    memory_mb: number;
    memory_usage_percent: number;
    storage_mb: number;
    storage_usage_percent: number;
  };
  location?: { lat: number; lng: number; accuracy?: number };
}

export interface MeshConnection {
  id: string;
  connection_id: string;
  node_a: string;
  node_b: string;
  connection_type: ConnectionType;
  status: 'connected' | 'disconnected' | 'weak';
  signal_strength: number;
  latency_ms?: number;
  bandwidth_kbps?: number;
  connected_at: Date;
  last_activity: Date;
}

export interface EdgeCache {
  id: string;
  cache_id: string;
  node_id: string;
  entity_type: string;
  item_count: number;
  size_bytes: number;
  max_size_bytes: number;
  policy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  ttl_seconds: number;
  last_accessed: Date;
  compression: 'none' | 'gzip' | 'lz4' | 'zstd';
}

export interface OfflineMapTile {
  id: string;
  tile_id: string;
  node_id: string;
  zoom_level: number;
  tile_x: number;
  tile_y: number;
  format: 'png' | 'webp' | 'pbf';
  data: Buffer | string;
  size_bytes: number;
  checksum: string;
  downloaded_at: Date;
  expires_at: Date;
  usage_count: number;
  last_accessed: Date;
}

export interface OfflineResource {
  id: string;
  resource_id: string;
  node_id: string;
  resource_type: 'map' | 'database' | 'model' | 'document' | 'media';
  name: string;
  version: string;
  size_bytes: number;
  checksum: string;
  downloaded_at: Date;
  expires_at: Date;
  status: 'downloading' | 'ready' | 'error' | 'expired';
  download_progress: number;
  metadata?: Record<string, unknown>;
}

export interface EdgeMLModel {
  id: string;
  model_id: string;
  node_id: string;
  name: string;
  version: string;
  framework: 'onnx' | 'tflite' | 'coreml' | 'tensorrt';
  size_bytes: number;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  accuracy?: number;
  inference_time_ms?: number;
  loaded_at?: Date;
  status: 'loading' | 'loaded' | 'error' | 'unloaded';
  configuration: Record<string, unknown>;
}

export interface EdgeInferenceRequest {
  id: string;
  request_id: string;
  node_id: string;
  model_id: string;
  input_data: Record<string, unknown>;
  priority: 'critical' | 'high' | 'normal' | 'low';
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  result?: Record<string, unknown>;
  error?: string;
  confidence?: number;
  inference_time_ms?: number;
}

export interface SyncConfiguration {
  id: string;
  config_id: string;
  entity_type: string;
  sync_strategy: 'realtime' | 'periodic' | 'on_change' | 'manual';
  sync_interval_seconds: number;
  conflict_resolution: ConflictResolutionStrategy;
  priority_rules: Record<string, 'critical' | 'high' | 'medium' | 'low'>;
  batch_size: number;
  compression: boolean;
  encryption: boolean;
  offline_first: boolean;
  background_sync: boolean;
}

export interface NetworkStatus {
  node_id: string;
  timestamp: Date;
  connection_type: ConnectionType;
  is_online: boolean;
  signal_strength: number;
  bandwidth_kbps: number;
  latency_ms: number;
  data_remaining_mb?: number;
  roaming: boolean;
  last_successful_sync?: Date;
  pending_changes: number;
  sync_health: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

export interface DataVersion {
  entity_type: string;
  entity_id: string;
  version: number;
  checksum: string;
  timestamp: Date;
  source_node_id: string;
  conflicts?: ConflictRecord[];
}

export interface OfflineLog {
  id: string;
  log_id: string;
  node_id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  timestamp: Date;
  local_timestamp: Date;
  sync_status: SyncStatus;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const OfflineDataSchema = z.object({
  id: z.string(),
  entity_type: z.string(),
  data: z.record(z.unknown()),
  sync_status: z.enum(['synced', 'pending_upload', 'pending_download', 'conflict', 'error', 'offline'])
});

const ConflictRecordSchema = z.object({
  id: z.string(),
  entity_type: z.string(),
  entity_id: z.string(),
  local_version: z.record(z.unknown()),
  server_version: z.record(z.unknown())
});

const MeshNodeSchema = z.object({
  id: z.string(),
  node_id: z.string(),
  type: z.enum(['mobile', 'tablet', 'vehicle', 'base_station', 'gateway', 'server', 'drone']),
  status: z.enum(['online', 'offline', 'degraded'])
});

const SyncConfigurationSchema = z.object({
  entity_type: z.string(),
  sync_strategy: z.enum(['realtime', 'periodic', 'on_change', 'manual']),
  conflict_resolution: z.enum(['server_wins', 'client_wins', 'newest_wins', 'oldest_wins', 'merge', 'manual'])
});

// ============================================================================
// Configuration
// ============================================================================

export const edgeConfig = {
  // Sync settings
  sync: {
    default_interval_seconds: 60,
    background_sync_enabled: true,
    wifi_only_sync: false,
    cellular_sync_allowed: true,
    roaming_sync_allowed: false,
    max_sync_retries: 3,
    retry_delay_seconds: 5,
    batch_size: 100,
    compression_level: 'medium', // none, low, medium, high
    encryption_enabled: true
  },
  
  // Conflict resolution
  conflict: {
    default_strategy: 'newest_wins' as ConflictResolutionStrategy,
    auto_merge_enabled: true,
    manual_review_threshold: 3, // conflicts requiring manual review
    conflict_history_retention_days: 30
  },
  
  // Mesh network
  mesh: {
    max_hops: 5,
    gateway_mode_enabled: true,
    relay_mode_enabled: true,
    discovery_interval_seconds: 30,
    heartbeat_interval_seconds: 10,
    connection_timeout_seconds: 60,
    preferred_channels: [1, 6, 11],
    band_preference: '2.4ghz',
    encryption: 'wpa3',
    signal_threshold_dbm: -70,
    preferred_connection_types: ['wifi', 'bluetooth', 'wifi_direct', 'mesh']
  },
  
  // Cache settings
  cache: {
    max_size_mb: 500,
    ttl_seconds: 86400, // 24 hours
    critical_ttl_seconds: 604800, // 7 days
    compression: 'lz4',
    eviction_policy: 'lru' as 'lru',
    prefetch_enabled: true,
    prefetch_radius_km: 10
  },
  
  // Offline maps
  offline_maps: {
    enabled: true,
    max_tiles: 10000,
    tile_size_bytes: 100000,
    formats: ['png', 'webp', 'pbf'],
    zoom_levels: [8, 9, 10, 11, 12, 13, 14, 15, 16],
    region_cache_mb: 200,
    auto_update: true,
    wifi_only: false
  },
  
  // Edge ML
  edge_ml: {
    enabled: true,
    frameworks: ['onnx', 'tflite'],
    max_model_size_mb: 100,
    inference_timeout_ms: 5000,
    batch_inference: true,
    gpu_acceleration: false,
    on_device_training: false,
    model_update_interval_hours: 24
  },
  
  // Display configuration
  display: {
    statusColors: {
      synced: '#22c55e',
      pending_upload: '#f59e0b',
      pending_download: '#3b82f6',
      conflict: '#ef4444',
      error: '#dc2626',
      offline: '#6b7280'
    },
    connectionTypeIcons: {
      wifi: 'wifi',
      cellular: 'signal',
      satellite: 'satellite',
      bluetooth: 'bluetooth',
      wifi_direct: 'share',
      mesh: 'network',
      wired: 'cable',
      none: 'wifi-off'
    },
    nodeStatusIcons: {
      online: 'check-circle',
      offline: 'x-circle',
      degraded: 'alert-triangle'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getSyncStatusInfo(status: SyncStatus) {
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: edgeConfig.display.statusColors[status],
    icon: {
      synced: 'check-circle',
      pending_upload: 'upload',
      pending_download: 'download',
      conflict: 'alert-triangle',
      error: 'x-circle',
      offline: 'wifi-off'
    }[status]
  };
}

export function getConnectionTypeInfo(type: ConnectionType) {
  return {
    label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: edgeConfig.display.connectionTypeIcons[type],
    priority: {
      wifi: 1,
      wired: 2,
      cellular: 3,
      bluetooth: 4,
      wifi_direct: 5,
      mesh: 6,
      satellite: 7,
      none: 8
    }[type]
  };
}

export function getNodeStatusInfo(status: MeshNode['status']) {
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    color: {
      online: '#22c55e',
      offline: '#ef4444',
      degraded: '#f59e0b'
    }[status],
    icon: edgeConfig.display.nodeStatusIcons[status]
  };
}

export function getConflictTypeInfo(type: ConflictType) {
  return {
    label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: {
      data_updated: 'refresh',
      data_deleted: 'trash',
      duplicate_created: 'copy',
      constraint_violation: 'alert-circle',
      schema_mismatch: 'file-warning'
    }[type]
  };
}

export function calculateSyncHealth(status: NetworkStatus): NetworkStatus['sync_health'] {
  if (!status.is_online) return 'offline';
  
  if (status.signal_strength > -60 && status.latency_ms < 50) return 'excellent';
  if (status.signal_strength > -70 && status.latency_ms < 100) return 'good';
  if (status.signal_strength > -80 && status.latency_ms < 200) return 'fair';
  return 'poor';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatSyncLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function getConflictResolutionLabel(strategy: ConflictResolutionStrategy): string {
  const labels: Record<ConflictResolutionStrategy, string> = {
    server_wins: 'Server Wins',
    client_wins: 'Client Wins',
    newest_wins: 'Newest Version',
    oldest_wins: 'Oldest Version',
    merge: 'Auto Merge',
    manual: 'Manual Review'
  };
  return labels[strategy];
}

export function shouldSyncNow(status: NetworkStatus, config: SyncConfiguration): boolean {
  if (!status.is_online) return false;
  if (status.pending_changes === 0 && config.sync_strategy !== 'realtime') return false;
  
  const health = calculateSyncHealth(status);
  return health !== 'offline' && health !== 'poor';
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Save offline data
 */
export async function saveOfflineData(
  data: Omit<OfflineData, 'id' | 'created_at' | 'updated_at'>
): Promise<OfflineData> {
  const { data: result, error } = await supabase
    .from('offline_data')
    .insert({
      data_id: `data-${Date.now()}`,
      entity_type: data.entity_type,
      data: data.data,
      version: data.version,
      checksum: generateChecksum(data.data),
      sync_status: data.sync_status,
      priority: data.priority,
      expires_at: data.expires_at,
      metadata: data.metadata
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to save offline data: ${error.message}`);
  return result;
}

/**
 * Get offline data
 */
export async function getOfflineData(
  entityType: string,
  entityId?: string
): Promise<OfflineData[]> {
  let query = supabase
    .from('offline_data')
    .select('*')
    .eq('entity_type', entityType)
    .gte('expires_at', new Date().toISOString());
  
  if (entityId) {
    query = query.eq('data_id', entityId);
  }
  
  const { data, error } = await query.order('priority', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch offline data: ${error.message}`);
  return data || [];
}

/**
 * Update sync status
 */
export async function updateSyncStatus(
  dataId: string,
  status: SyncStatus
): Promise<void> {
  const { error } = await supabase
    .from('offline_data')
    .update({
      sync_status: status,
      last_synced_at: new Date().toISOString()
    })
    .eq('data_id', dataId);
  
  if (error) throw new Error(`Failed to update sync status: ${error.message}`);
}

/**
 * Add to sync queue
 */
export async function addToSyncQueue(
  item: Omit<DataSyncQueue, 'id' | 'queue_id' | 'created_at' | 'retry_count' | 'status'>
): Promise<DataSyncQueue> {
  const { data, error } = await supabase
    .from('sync_queue')
    .insert({
      queue_id: `queue-${Date.now()}`,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      operation: item.operation,
      data: item.data,
      priority: item.priority,
      max_retries: item.max_retries,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to add to queue: ${error.message}`);
  return data;
}

/**
 * Get sync queue
 */
export async function getSyncQueue(
  nodeId: string,
  limit: number = 100
): Promise<DataSyncQueue[]> {
  const { data, error } = await supabase
    .from('sync_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) throw new Error(`Failed to fetch queue: ${error.message}`);
  return data || [];
}

/**
 * Process sync queue
 */
export async function processSyncQueue(
  nodeId: string,
  batchSize: number = 10
): Promise<{ processed: number; failed: number }> {
  const queue = await getSyncQueue(nodeId, batchSize);
  let processed = 0;
  let failed = 0;
  
  for (const item of queue) {
    try {
      // Mark as processing
      await supabase
        .from('sync_queue')
        .update({ status: 'processing', processing_at: new Date().toISOString() })
        .eq('id', item.id);
      
      // Sync item
      await syncItem(item);
      
      // Mark as completed
      await supabase
        .from('sync_queue')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', item.id);
      
      processed++;
    } catch (error) {
      // Handle failure
      await supabase
        .from('sync_queue')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          retry_count: item.retry_count + 1
        })
        .eq('id', item.id);
      
      failed++;
    }
  }
  
  return { processed, failed };
}

/**
 * Sync individual item
 */
async function syncItem(item: DataSyncQueue): Promise<void> {
  switch (item.operation) {
    case 'create':
      await supabase.from(item.entity_type).insert(item.data);
      break;
    case 'update':
      await supabase
        .from(item.entity_type)
        .update(item.data)
        .eq('id', item.entity_id);
      break;
    case 'delete':
      await supabase
        .from(item.entity_type)
        .delete()
        .eq('id', item.entity_id);
      break;
  }
}

/**
 * Record conflict
 */
export async function recordConflict(
  conflict: Omit<ConflictRecord, 'id' | 'created_at' | 'status'>
): Promise<ConflictRecord> {
  const { data, error } = await supabase
    .from('conflicts')
    .insert({
      conflict_id: `conflict-${Date.now()}`,
      entity_type: conflict.entity_type,
      entity_id: conflict.entity_id,
      local_version: conflict.local_version,
      server_version: conflict.server_version,
      merged_version: conflict.merged_version,
      resolved_by: conflict.resolved_by,
      status: 'pending',
      conflict_type: conflict.conflict_type,
      reason: conflict.reason
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to record conflict: ${error.message}`);
  return data;
}

/**
 * Resolve conflict
 */
export async function resolveConflict(
  conflictId: string,
  resolution: ConflictResolutionStrategy,
  mergedVersion?: Record<string, unknown>,
  resolvedBy?: string
): Promise<void> {
  const { error } = await supabase
    .from('conflicts')
    .update({
      resolution,
      merged_version: mergedVersion,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      status: 'resolved'
    })
    .eq('id', conflictId);
  
  if (error) throw new Error(`Failed to resolve conflict: ${error.message}`);
  
  // If merged, sync the merged version
  if (mergedVersion && resolution === 'merge') {
    // Would trigger sync of merged version
  }
}

/**
 * Get pending conflicts
 */
export async function getPendingConflicts(
  nodeId?: string
): Promise<ConflictRecord[]> {
  const { data, error } = await supabase
    .from('conflicts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch conflicts: ${error.message}`);
  return data || [];
}

/**
 * Register mesh network
 */
export async function registerMeshNetwork(
  network: Omit<MeshNetwork, 'id' | 'created_at' | 'node_count'>
): Promise<MeshNetwork> {
  const { data, error } = await supabase
    .from('mesh_networks')
    .insert({
      network_id: `network-${Date.now()}`,
      name: network.name,
      network_key: network.network_key,
      max_nodes: network.max_nodes,
      status: 'active',
      configuration: network.configuration
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to register network: ${error.message}`);
  return data;
}

/**
 * Register mesh node
 */
export async function registerMeshNode(
  node: Omit<MeshNode, 'id' | 'last_seen' | 'status'>
): Promise<MeshNode> {
  const { data, error } = await supabase
    .from('mesh_nodes')
    .insert({
      node_id: `node-${Date.now()}`,
      network_id: node.network_id,
      device_id: node.device_id,
      name: node.name,
      type: node.type,
      role: node.role,
      status: 'online',
      connection_type: node.connection_type,
      capabilities: node.capabilities,
      resources: node.resources
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to register node: ${error.message}`);
  return data;
}

/**
 * Update node heartbeat
 */
export async function updateNodeHeartbeat(
  nodeId: string,
  status?: MeshNode['status'],
  location?: MeshNode['location']
): Promise<void> {
  const updates: Record<string, unknown> = {
    last_seen: new Date().toISOString()
  };
  
  if (status) updates.status = status;
  if (location) updates.location = location;
  
  const { error } = await supabase
    .from('mesh_nodes')
    .update(updates)
    .eq('node_id', nodeId);
  
  if (error) throw new Error(`Failed to update heartbeat: ${error.message}`);
}

/**
 * Get mesh nodes
 */
export async function getMeshNodes(
  networkId: string
): Promise<MeshNode[]> {
  const { data, error } = await supabase
    .from('mesh_nodes')
    .select('*')
    .eq('network_id', networkId)
    .gte('last_seen', new Date(Date.now() - 60 * 1000).toISOString()); // Last minute
  
  if (error) throw new Error(`Failed to fetch nodes: ${error.message}`);
  return data || [];
}

/**
 * Create mesh connection
 */
export async function createMeshConnection(
  connection: Omit<MeshConnection, 'id' | 'connected_at'>
): Promise<MeshConnection> {
  const { data, error } = await supabase
    .from('mesh_connections')
    .insert({
      connection_id: `conn-${Date.now()}`,
      node_a: connection.node_a,
      node_b: connection.node_b,
      connection_type: connection.connection_type,
      status: 'connected',
      signal_strength: connection.signal_strength
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create connection: ${error.message}`);
  return data;
}

/**
 * Get mesh connections
 */
export async function getMeshConnections(
  nodeId: string
): Promise<MeshConnection[]> {
  const { data, error } = await supabase
    .from('mesh_connections')
    .select('*')
    .or(`node_a.eq.${nodeId},node_b.eq.${nodeId}`)
    .eq('status', 'connected')
    .gte('last_activity', new Date(Date.now() - 60 * 1000).toISOString());
  
  if (error) throw new Error(`Failed to fetch connections: ${error.message}`);
  return data || [];
}

/**
 * Download offline map tile
 */
export async function downloadOfflineTile(
  nodeId: string,
  tile: Omit<OfflineMapTile, 'id' | 'downloaded_at' | 'usage_count' | 'last_accessed'>
): Promise<OfflineMapTile> {
  const { data, error } = await supabase
    .from('offline_tiles')
    .insert({
      tile_id: `tile-${Date.now()}`,
      node_id: nodeId,
      zoom_level: tile.zoom_level,
      tile_x: tile.tile_x,
      tile_y: tile.tile_y,
      format: tile.format,
      data: tile.data,
      size_bytes: tile.size_bytes,
      checksum: tile.checksum,
      expires_at: tile.expires_at
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to download tile: ${error.message}`);
  return data;
}

/**
 * Get offline tiles for region
 */
export async function getOfflineTiles(
  nodeId: string,
  zoomLevel: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): Promise<OfflineMapTile[]> {
  const { data, error } = await supabase
    .from('offline_tiles')
    .select('*')
    .eq('node_id', nodeId)
    .eq('zoom_level', zoomLevel)
    .gte('tile_x', bounds.minX)
    .lte('tile_x', bounds.maxX)
    .gte('tile_y', bounds.minY)
    .lte('tile_y', bounds.maxY)
    .gte('expires_at', new Date().toISOString());
  
  if (error) throw new Error(`Failed to fetch tiles: ${error.message}`);
  return data || [];
}

/**
 * Download offline resource
 */
export async function downloadOfflineResource(
  resource: Omit<OfflineResource, 'id' | 'downloaded_at' | 'download_progress'>
): Promise<OfflineResource> {
  const { data, error } = await supabase
    .from('offline_resources')
    .insert({
      resource_id: `resource-${Date.now()}`,
      node_id: resource.node_id,
      resource_type: resource.resource_type,
      name: resource.name,
      version: resource.version,
      size_bytes: resource.size_bytes,
      checksum: resource.checksum,
      expires_at: resource.expires_at,
      status: 'downloading',
      download_progress: 0,
      metadata: resource.metadata
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to download resource: ${error.message}`);
  return data;
}

/**
 * Update download progress
 */
export async function updateDownloadProgress(
  resourceId: string,
  progress: number,
  checksum?: string
): Promise<void> {
  const updates: Record<string, unknown> = { download_progress: progress };
  if (checksum) updates.checksum = checksum;
  
  const { error } = await supabase
    .from('offline_resources')
    .update(updates)
    .eq('id', resourceId);
  
  if (error) throw new Error(`Failed to update progress: ${error.message}`);
}

/**
 * Complete download
 */
export async function completeDownload(resourceId: string): Promise<void> {
  const { error } = await supabase
    .from('offline_resources')
    .update({
      status: 'ready',
      download_progress: 100
    })
    .eq('id', resourceId);
  
  if (error) throw new Error(`Failed to complete download: ${error.message}`);
}

/**
 * Get offline resources
 */
export async function getOfflineResources(
  nodeId: string
): Promise<OfflineResource[]> {
  const { data, error } = await supabase
    .from('offline_resources')
    .select('*')
    .eq('node_id', nodeId)
    .eq('status', 'ready')
    .gte('expires_at', new Date().toISOString());
  
  if (error) throw new Error(`Failed to fetch resources: ${error.message}`);
  return data || [];
}

/**
 * Load edge ML model
 */
export async function loadEdgeMLModel(
  nodeId: string,
  model: Omit<EdgeMLModel, 'id' | 'loaded_at' | 'status'>
): Promise<EdgeMLModel> {
  const { data, error } = await supabase
    .from('edge_models')
    .insert({
      model_id: `model-${Date.now()}`,
      node_id: nodeId,
      name: model.name,
      version: model.version,
      framework: model.framework,
      size_bytes: model.size_bytes,
      input_schema: model.input_schema,
      output_schema: model.output_schema,
      accuracy: model.accuracy,
      inference_time_ms: model.inference_time_ms,
      status: 'loaded',
      loaded_at: new Date().toISOString(),
      configuration: model.configuration
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to load model: ${error.message}`);
  return data;
}

/**
 * Run edge inference
 */
export async function runEdgeInference(
  request: Omit<EdgeInferenceRequest, 'id' | 'created_at'>
): Promise<EdgeInferenceRequest> {
  const { data, error } = await supabase
    .from('edge_inference_requests')
    .insert({
      request_id: `inference-${Date.now()}`,
      node_id: request.node_id,
      model_id: request.model_id,
      input_data: request.input_data,
      priority: request.priority,
      started_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to run inference: ${error.message}`);
  return data;
}

/**
 * Complete inference
 */
export async function completeInference(
  requestId: string,
  result: Record<string, unknown>,
  confidence?: number,
  inferenceTimeMs?: number
): Promise<void> {
  const { error } = await supabase
    .from('edge_inference_requests')
    .update({
      result,
      confidence,
      inference_time_ms: inferenceTimeMs,
      completed_at: new Date().toISOString()
    })
    .eq('id', requestId);
  
  if (error) throw new Error(`Failed to complete inference: ${error.message}`);
}

/**
 * Get sync configuration
 */
export async function getSyncConfiguration(
  entityType?: string
): Promise<SyncConfiguration[]> {
  let query = supabase.from('sync_configurations').select('*');
  
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch config: ${error.message}`);
  return data || [];
}

/**
 * Update sync configuration
 */
export async function updateSyncConfiguration(
  config: Partial<SyncConfiguration>
): Promise<void> {
  const { error } = await supabase
    .from('sync_configurations')
    .upsert({
      ...config,
      updated_at: new Date().toISOString()
    });
  
  if (error) throw new Error(`Failed to update config: ${error.message}`);
}

/**
 * Update network status
 */
export async function updateNetworkStatus(
  nodeId: string,
  status: Omit<NetworkStatus, 'node_id' | 'timestamp'>
): Promise<void> {
  const { error } = await supabase
    .from('network_status')
    .upsert({
      node_id: nodeId,
      timestamp: new Date().toISOString(),
      ...status
    });
  
  if (error) throw new Error(`Failed to update status: ${error.message}`);
}

/**
 * Get network status
 */
export async function getNetworkStatus(
  nodeId: string
): Promise<NetworkStatus | null> {
  const { data, error } = await supabase
    .from('network_status')
    .select('*')
    .eq('node_id', nodeId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch status: ${error.message}`);
  }
  return data;
}

/**
 * Record offline log
 */
export async function recordOfflineLog(
  log: Omit<OfflineLog, 'id' | 'timestamp'>
): Promise<void> {
  const { error } = await supabase
    .from('offline_logs')
    .insert({
      log_id: `log-${Date.now()}`,
      node_id: log.node_id,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      operation: log.operation,
      local_timestamp: log.local_timestamp,
      sync_status: log.sync_status,
      metadata: log.metadata
    });
  
  if (error) console.error('Failed to record log:', error.message);
}

/**
 * Full sync
 */
export async function fullSync(
  nodeId: string
): Promise<{ uploaded: number; downloaded: number; conflicts: number }> {
  // Get all pending changes
  const { data: pending } = await supabase
    .from('offline_data')
    .select('*')
    .eq('sync_status', 'pending_upload')
    .eq('node_id', nodeId);
  
  let uploaded = 0;
  let downloaded = 0;
  let conflicts = 0;
  
  // Upload pending changes
  for (const item of pending || []) {
    try {
      await supabase.from(item.entity_type).upsert(item.data);
      await updateSyncStatus(item.data_id, 'synced');
      uploaded++;
    } catch (error) {
      await updateSyncStatus(item.data_id, 'error');
    }
  }
  
  // Download server changes
  const { data: serverData } = await supabase
    .from('offline_data')
    .select('*')
    .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  for (const item of serverData || []) {
    if (item.node_id !== nodeId) {
      // Check for conflicts
      const localItem = pending?.find(p => p.entity_id === item.entity_id);
      if (localItem && localItem.version !== item.version) {
        conflicts++;
        await recordConflict({
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          local_version: localItem.data,
          server_version: item.data,
          conflict_type: 'data_updated'
        });
      } else {
        downloaded++;
      }
    }
  }
  
  return { uploaded, downloaded, conflicts };
}

/**
 * Clear local cache
 */
export async function clearLocalCache(
  nodeId: string,
  preserveCritical: boolean = true
): Promise<number> {
  let query = supabase
    .from('offline_data')
    .delete()
    .eq('node_id', nodeId);
  
  if (preserveCritical) {
    query = query.neq('priority', 'critical');
  }
  
  const { count, error } = await supabase
    .from('offline_data')
    .select('*', { count: 'exact', head: true })
    .eq('node_id', nodeId);
  
  if (preserveCritical) {
    await supabase
      .from('offline_data')
      .delete()
      .eq('node_id', nodeId)
      .neq('priority', 'critical');
  } else {
    await supabase
      .from('offline_data')
      .delete()
      .eq('node_id', nodeId);
  }
  
  if (error) throw new Error(`Failed to clear cache: ${error.message}`);
  return count || 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateChecksum(data: Record<string, unknown>): string {
  // Simplified checksum - in production would use proper hashing
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function calculateSyncProgress(
  total: number,
  synced: number,
  conflicts: number
): number {
  if (total === 0) return 100;
  const completed = synced - conflicts; // Subtract conflicts as they're not fully resolved
  return Math.round((completed / total) * 100);
}

export function estimateSyncTime(
  pendingChanges: number,
  avgSizeBytes: number,
  bandwidthKbps: number
): number {
  const totalBytes = pendingChanges * avgSizeBytes;
  const totalBits = totalBytes * 8;
  const bandwidthBits = bandwidthKbps * 1000;
  return totalBits / bandwidthBits; // in seconds
}
