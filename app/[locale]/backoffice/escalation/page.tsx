import { EscalationDashboard, Escalation } from '@/components/escalation/escalation-dashboard';
import { createClient } from '@/lib/supabase/server';
import { resolveEscalation, dismissEscalation } from '@/app/backoffice/actions';

async function getEscalations(): Promise<Escalation[]> {
  const supabase = createClient();
  
  // Fetch service requests that are escalated
  const { data: requests } = await supabase
    .from('service_requests')
    .select('*')
    .not('current_escalation_level', 'is', null);

  // Map to Escalation interface
  const mappedRequests: Escalation[] = (requests || []).map(r => ({
    id: r.id,
    entity_type: 'service_request',
    entity_id: r.id,
    entity_title: r.title,
    current_level: parseInt(r.current_escalation_level?.replace('level_', '') || '1'),
    max_level: 4,
    status: 'active', // Mapping status based on actual logic later
    triggered_at: r.escalated_at || r.created_at,
    triggered_by: 'System', // This should come from a join or audit log
    reason: 'SLA Breach or Manual Escalation',
    time_elapsed_minutes: Math.floor((new Date().getTime() - new Date(r.created_at).getTime()) / 60000),
    sla_deadline: r.sla_resolution_deadline,
  }));

  // Fetch incidents that are escalated
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .not('current_escalation_level', 'is', null);

  const mappedIncidents: Escalation[] = (incidents || []).map(i => ({
    id: i.id,
    entity_type: 'incident',
    entity_id: i.id,
    entity_title: i.title,
    current_level: parseInt(i.current_escalation_level?.replace('level_', '') || '1'),
    max_level: 4,
    status: 'active',
    triggered_at: i.detected_at,
    triggered_by: 'System',
    reason: 'High Severity Incident',
    time_elapsed_minutes: Math.floor((new Date().getTime() - new Date(i.detected_at).getTime()) / 60000),
  }));

  return [...mappedRequests, ...mappedIncidents];
}

export default async function EscalationPage() {
  const escalations = await getEscalations();

  return (
    <div className="space-y-6">
      <EscalationDashboard 
        escalations={escalations}
        slaMetrics={[]} // TODO: Fetch SLA metrics
        onResolve={async (id) => {
          'use server';
          const type = escalations.find(e => e.id === id)?.entity_type || 'service_request';
          await resolveEscalation(id, type);
        }}
        onDismiss={async (id) => {
          'use server';
          const type = escalations.find(e => e.id === id)?.entity_type || 'service_request';
          await dismissEscalation(id, type);
        }}
      />
    </div>
  );
}
