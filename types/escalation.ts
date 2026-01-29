// Escalation Types for Support System

export type EscalationTriggerType = 
  | 'time_based'
  | 'severity_based'
  | 'impact_based'
  | 'manual'
  | 'sla_breach';

export type EscalationStatus = 
  | 'pending'
  | 'triggered'
  | 'acknowledged'
  | 'resolved'
  | 'cancelled';

export type EscalationLevel = 1 | 2 | 3 | 4 | 5;

export interface EscalationRuleFormData {
  name: string;
  description?: string;
  entity_type: 'service_request' | 'incident';
  priority_levels?: string[];
  trigger_type: EscalationTriggerType;
  trigger_config: {
    time_threshold_minutes?: number;
    severity_threshold?: string;
    impact_threshold?: number;
    sla_breach_imminent_minutes?: number;
  };
  escalation_level: EscalationLevel;
  target_department?: string;
  target_team?: string;
  target_user_id?: string;
  notification_channels: string[];
  auto_escalate: boolean;
  max_escalation_level?: number;
  is_active: boolean;
}

export interface EscalationRule {
  id: string;
  name: string;
  description?: string;
  entity_type: string;
  priority_levels: string[];
  trigger_type: EscalationTriggerType;
  trigger_config: {
    time_threshold_minutes?: number;
    severity_threshold?: string;
    impact_threshold?: number;
    sla_breach_imminent_minutes?: number;
  };
  escalation_level: EscalationLevel;
  target_department?: string;
  target_team?: string;
  target_user_id?: string;
  notification_channels: string[];
  auto_escalate: boolean;
  max_escalation_level?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EscalationHistoryFormData {
  entity_type: string;
  entity_id: string;
  escalation_rule_id: string;
  triggered_by: 'system' | 'user';
  triggered_by_user_id?: string;
  trigger_reason?: string;
  from_level: EscalationLevel;
  to_level: EscalationLevel;
  notification_sent: boolean;
  notifications: NotificationRecord[];
  status: EscalationStatus;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface NotificationRecord {
  channel: string;
  recipient_type: 'user' | 'department' | 'team' | 'role';
  recipient_id: string;
  recipient_name?: string;
  sent_at: string;
  delivered: boolean;
  delivered_at?: string;
  read_at?: string;
  failed_reason?: string;
}

export interface EscalationHistory {
  id: string;
  entity_type: string;
  entity_id: string;
  escalation_rule_id: string;
  triggered_by: 'system' | 'user';
  triggered_by_user_id?: string;
  trigger_reason?: string;
  from_level: EscalationLevel;
  to_level: EscalationLevel;
  notification_sent: boolean;
  notifications: NotificationRecord[];
  status: EscalationStatus;
  current_level: EscalationLevel;
  acknowledged_at?: string;
  acknowledged_by?: string;
  acknowledged_notes?: string;
  resolved_at?: string;
  resolution_notes?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EscalationListParams {
  entity_type?: string;
  entity_id?: string;
  status?: EscalationStatus[];
  from_level?: EscalationLevel;
  to_level?: EscalationLevel;
  date_from?: string;
  date_to?: string;
  triggered_by?: 'system' | 'user';
  limit?: number;
  offset?: number;
}

export interface EscalationStats {
  total_escalations: number;
  active_escalations: number;
  resolved_escalations: number;
  pending_escalations: number;
  avg_resolution_time_minutes: number;
  escalations_by_level: Record<EscalationLevel, number>;
  escalations_by_trigger: Record<EscalationTriggerType, number>;
  escalations_by_entity_type: Record<string, number>;
}

export interface EscalationRuleListParams {
  entity_type?: string;
  trigger_type?: EscalationTriggerType[];
  escalation_level?: EscalationLevel[];
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface EscalationUpdateData {
  status?: EscalationStatus;
  acknowledged_notes?: string;
  resolution_notes?: string;
}

export interface ManualEscalationRequest {
  entity_type: string;
  entity_id: string;
  target_level: EscalationLevel;
  reason: string;
  notify_channels?: string[];
}

export interface EscalationTriggerResult {
  triggered: boolean;
  escalation_id?: string;
  rule_id?: string;
  reason?: string;
}

export interface EscalationCheckResult {
  entity_type: string;
  entity_id: string;
  current_level: EscalationLevel;
  eligible_rules: EscalationRule[];
  should_escalate: boolean;
  triggered_escalations: EscalationHistory[];
}

export type EscalationFilter = {
  search?: string;
  entity_type?: string[];
  status?: EscalationStatus[];
  escalation_level?: EscalationLevel[];
  triggered_by?: ('system' | 'user')[];
  date_from?: string;
  date_to?: string;
};

export type EscalationRuleFilter = {
  search?: string;
  entity_type?: string[];
  trigger_type?: EscalationTriggerType[];
  escalation_level?: EscalationLevel[];
  is_active?: boolean;
};
