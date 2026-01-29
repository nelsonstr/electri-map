"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { 
  MessageSquare, Mail, Phone, Megaphone, Send, Inbox,
  Search, Filter, Plus, Edit, Trash2, Copy, CheckCircle,
  Clock, Users, FileText, History, Settings, RefreshCw
} from 'lucide-react';

// Types
export interface Communication {
  id: string;
  entity_type: 'service_request' | 'incident' | 'maintenance';
  entity_id: string;
  channel: 'sms' | 'email' | 'phone' | 'in_app';
  recipient_type: 'citizen' | 'staff' | 'all_affected';
  recipient?: { id: string; name: string; phone?: string; email?: string };
  subject?: string;
  message: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
  scheduled_for?: string;
  sent_by?: { id: string; name: string };
  templates_used?: string[];
  metadata?: {
    delivered_count?: number;
    opened_count?: number;
    failed_count?: number;
    cost?: number;
  };
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  category: string;
  channel: 'sms' | 'email' | 'phone' | 'all';
  subject?: string;
  body: string;
  variables: string[];
  is_active: boolean;
  usage_count: number;
  last_used?: string;
  created_at: string;
  updated_at: string;
}

interface CommunicationCenterProps {
  communications?: Communication[];
  templates?: CommunicationTemplate[];
  onSend?: (communication: Partial<Communication>) => void;
  onSchedule?: (communication: Partial<Communication>, scheduledTime: string) => void;
  onDraftSave?: (communication: Partial<Communication>) => void;
  onDelete?: (id: string) => void;
  onSendTest?: (templateId: string, recipient: string) => void;
}

const channelConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  sms: { color: 'text-green-600', bgColor: 'bg-green-100', icon: Phone, label: 'SMS' },
  email: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Mail, label: 'Email' },
  phone: { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Phone, label: 'Phone' },
  in_app: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: MessageSquare, label: 'In-App' },
};

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileText },
  scheduled: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  sent: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  failed: { color: 'text-red-600', bgColor: 'bg-red-100', icon: Clock },
  cancelled: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock },
};

export function CommunicationCenter({
  communications = [],
  templates = [],
  onSend,
  onSchedule,
  onDraftSave,
  onDelete,
  onSendTest
}: CommunicationCenterProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('compose');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Compose state
  const [composeChannel, setComposeChannel] = useState<'sms' | 'email'>('sms');
  const [composeRecipientType, setComposeRecipientType] = useState<'citizen' | 'staff'>('citizen');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Schedule modal state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  // Filter communications
  const filteredCommunications = communications.filter(c => {
    const matchesSearch = c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = filterChannel === 'all' || c.channel === filterChannel;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  // Drafts, scheduled, sent
  const drafts = communications.filter(c => c.status === 'draft');
  const scheduled = communications.filter(c => c.status === 'scheduled');
  const sent = communications.filter(c => c.status === 'sent');

  // Statistics
  const stats = {
    totalSent: communications.filter(c => c.status === 'sent').length,
    totalScheduled: scheduled.length,
    totalDrafts: drafts.length,
    deliveryRate: communications.length > 0 
      ? Math.round((communications.filter(c => c.status === 'sent').length / communications.length) * 100)
      : 0,
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      if (template.subject) setComposeSubject(template.subject);
      
      let body = template.body;
      body = body.replace(/\{\{name\}\}/g, 'John Doe');
      body = body.replace(/\{\{request_id\}\}/g, 'SR-2024-001');
      body = body.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
      body = body.replace(/\{\{location\}\}/g, '123 Main Street');
      
      setComposeMessage(body);
      toast({ title: 'Template Applied', description: `${template.name} template has been applied.` });
    }
  };

  const handleSend = useCallback(() => {
    if (!composeMessage.trim()) {
      toast({ title: 'Error', description: 'Please enter a message', variant: 'destructive' });
      return;
    }

    const communication: Partial<Communication> = {
      entity_type: 'service_request',
      entity_id: '',
      channel: composeChannel,
      recipient_type: composeRecipientType,
      subject: composeChannel === 'email' ? composeSubject : undefined,
      message: composeMessage,
      status: 'sent',
    };

    onSend?.(communication);
    toast({ title: 'Message Sent', description: 'Your message has been sent successfully.' });
    setComposeMessage('');
    setComposeSubject('');
    setSelectedTemplate('');
  }, [composeChannel, composeRecipientType, composeSubject, composeMessage, onSend, toast]);

  const handleSchedule = useCallback(() => {
    if (!scheduledTime) {
      toast({ title: 'Error', description: 'Please select a scheduled time', variant: 'destructive' });
      return;
    }

    const communication: Partial<Communication> = {
      entity_type: 'service_request',
      entity_id: '',
      channel: composeChannel,
      recipient_type: composeRecipientType,
      subject: composeChannel === 'email' ? composeSubject : undefined,
      message: composeMessage,
      status: 'scheduled',
      scheduled_for: scheduledTime,
    };

    onSchedule?.(communication, scheduledTime);
    toast({ title: 'Message Scheduled', description: `Message scheduled for ${new Date(scheduledTime).toLocaleString()}.` });
    setScheduleDialogOpen(false);
    setScheduledTime('');
  }, [composeChannel, composeRecipientType, composeSubject, composeMessage, scheduledTime, onSchedule, toast]);

  const handleSaveDraft = useCallback(() => {
    const communication: Partial<Communication> = {
      entity_type: 'service_request',
      entity_id: '',
      channel: composeChannel,
      recipient_type: composeRecipientType,
      subject: composeChannel === 'email' ? composeSubject : undefined,
      message: composeMessage,
      status: 'draft',
    };

    onDraftSave?.(communication);
    toast({ title: 'Draft Saved', description: 'Your message has been saved as a draft.' });
  }, [composeChannel, composeRecipientType, composeSubject, composeMessage, onDraftSave, toast]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communication Center</h1>
          <p className="text-muted-foreground">Multi-channel communication hub</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
                <p className="text-sm text-muted-foreground">Messages Sent</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalScheduled}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalDrafts}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Broadcast
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>New Message</CardTitle>
                  <CardDescription>Create a new communication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Channel Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Channel</label>
                    <div className="flex gap-2">
                      <Button
                        variant={composeChannel === 'sms' ? 'default' : 'outline'}
                        onClick={() => setComposeChannel('sms')}
                        className="flex-1"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        SMS
                      </Button>
                      <Button
                        variant={composeChannel === 'email' ? 'default' : 'outline'}
                        onClick={() => setComposeChannel('email')}
                        className="flex-1"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>

                  {/* Recipient Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recipient Type</label>
                    <Select value={composeRecipientType} onValueChange={(v) => setComposeRecipientType(v as 'citizen' | 'staff')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">Citizen / Customer</SelectItem>
                        <SelectItem value="staff">Staff / Team Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Use Template (Optional)</label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.filter(t => t.is_active).map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject (Email only) */}
                  {composeChannel === 'email' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        placeholder="Enter email subject..."
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      placeholder={composeChannel === 'sms' ? 'Enter your SMS message...' : 'Enter your email body...'}
                      value={composeMessage}
                      onChange={(e) => setComposeMessage(e.target.value)}
                      rows={6}
                    />
                    {composeChannel === 'sms' && (
                      <p className="text-xs text-muted-foreground">
                        {composeMessage.length}/160 characters
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={handleSaveDraft}>
                      <FileText className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button onClick={handleSend}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Drafts</span>
                    <Badge>{drafts.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scheduled</span>
                    <Badge className="bg-blue-100 text-blue-700">{scheduled.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sent Today</span>
                    <Badge className="bg-green-100 text-green-700">{sent.length}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Use templates for common messages</p>
                  <p>• Schedule messages for optimal timing</p>
                  <p>• Check delivery status in History</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search communications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Communications List */}
            <div className="space-y-3">
              {filteredCommunications.map(communication => {
                const channel = channelConfig[communication.channel];
                const status = statusConfig[communication.status];
                const ChannelIcon = channel.icon;
                const StatusIcon = status.icon;

                return (
                  <Card key={communication.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-2 rounded-lg", channel.bgColor)}>
                            <ChannelIcon className={cn("h-5 w-5", channel.color)} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={status.bgColor}>
                                <StatusIcon className={cn("h-3 w-3 mr-1", status.color)} />
                                {communication.status}
                              </Badge>
                              <Badge variant="outline">{channel.label}</Badge>
                            </div>
                            <h3 className="font-medium">{communication.subject || 'No subject'}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{communication.message}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {communication.sent_at && (
                                <span>Sent: {formatDateTime(communication.sent_at)}</span>
                              )}
                              {communication.scheduled_for && (
                                <span>Scheduled: {formatDateTime(communication.scheduled_for)}</span>
                              )}
                              {communication.sent_by && (
                                <span>By: {communication.sent_by.name}</span>
                              )}
                            </div>
                            {communication.metadata && (
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span>Delivered: {communication.metadata.delivered_count || 0}</span>
                                <span>Opened: {communication.metadata.opened_count || 0}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDelete?.(communication.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredCommunications.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No communications found</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Message Templates</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => {
                const channel = channelConfig[template.channel] || channelConfig.in_app;
                const ChannelIcon = channel.icon;

                return (
                  <Card key={template.id} className={template.is_active ? '' : 'opacity-60'}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.category}</CardDescription>
                        </div>
                        <div className={cn("p-2 rounded-lg", channel.bgColor)}>
                          <ChannelIcon className={cn("h-4 w-4", channel.color)} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">{template.body}</p>
                      
                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map(v => (
                            <Badge key={v} variant="outline" className="text-xs">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Used {template.usage_count} times</span>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onSendTest?.(template.id, 'test@example.com')}>
                          <Send className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Message</CardTitle>
              <CardDescription>Send messages to multiple recipients at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Select defaultValue="all_affected">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_customers">All Customers</SelectItem>
                    <SelectItem value="all_affected">All Affected (by incident/maintenance)</SelectItem>
                    <SelectItem value="specific_area">Specific Geographic Area</SelectItem>
                    <SelectItem value="subscribers">Service Subscribers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Channel</label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    SMS
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    In-App
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Recipients</label>
                <Input value="1,234" disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Template</label>
                <Select defaultValue="emergency">
                  <SelectTrigger>
                    <SelectValue placeholder="Select template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.category === 'Emergency').map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">
                <Megaphone className="h-4 w-4 mr-2" />
                Send Broadcast
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Message</DialogTitle>
            <DialogDescription>Choose when to send this message</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date and Time</label>
              <Input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSchedule}>
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
