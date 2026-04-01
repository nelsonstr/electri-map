// Civic Issue Reporting Types

export type IssueCategory =
  | 'telecommunications'
  | 'road_damage'
  | 'electrical'
  | 'water_supply'
  | 'waste_management'
  | 'public_lighting'
  | 'traffic_signals'
  | 'sidewalks'
  | 'parks_recreation'
  | 'building_safety'
  | 'environmental'
  | 'other';

export type issueCategory = IssueCategory;

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export type issuePriority = IssuePriority;

export type IssueStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'pending_parts'
  | 'completed'
  | 'verified'
  | 'closed';

export type issueStatus = IssueStatus;

export type MediaType = 'photo' | 'video';

export type mediaType = MediaType;

export interface IssueLocation {
  latitude: number;
  longitude: number;
  address?: string;
  neighborhood?: string;
  city?: string;
}

export interface MediaAttachment {
  id: string;
  issue_id: string;
  type: MediaType;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  uploaded_by: string;
  created_at: string;
}

export interface IssueVerification {
  id: string;
  issue_id: string;
  user_id: string;
  confirmed: boolean;
  additional_info?: string;
  created_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  user_name: string;
  content: string;
  is_official: boolean;
  department?: string;
  created_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  location: IssueLocation;
  address?: string;
  reporter_id: string;
  reporter_name: string;
  reporter_phone?: string;
  assigned_department?: string;
  assigned_to?: string;
  work_order_id?: string;
  media: MediaAttachment[];
  verifications: IssueVerification[];
  comments: IssueComment[];
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  started_at?: string;
  completed_at?: string;
  verified_at?: string;
  closed_at?: string;
  estimated_completion?: string;
  actual_response_time_hours?: number;
  actual_completion_time_hours?: number;
}

export interface IssueFormData {
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  location: IssueLocation;
  reporter_name: string;
  reporter_phone?: string;
  reporter_email?: string;
  media_files?: File[];
}

export interface IssueStats {
  total_reports: number;
  by_category: Record<IssueCategory, number>;
  by_status: Record<IssueStatus, number>;
  by_priority: Record<IssuePriority, number>;
  average_response_time_hours: number;
  average_completion_time_hours: number;
  completion_rate: number;
  verification_rate: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  responsible_categories: IssueCategory[];
}

export interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  status_updates: boolean;
  nearby_reports: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'citizen' | 'officer' | 'admin';
  department?: string;
  notification_settings: NotificationSettings;
  language: string;
  accessibility_mode: boolean;
  created_at: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
