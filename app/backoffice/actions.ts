'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function resolveEscalation(id: string, type: 'service_request' | 'incident' | 'maintenance') {
  const supabase = createClient();
  
  const table = type === 'service_request' ? 'service_requests' : 
                type === 'incident' ? 'incidents' : 'maintenance_work_orders';

  const { error } = await supabase
    .from(table)
    .update({ 
      status: type === 'service_request' ? 'completed' : 'resolved',
      current_escalation_level: null // Clear escalation on resolution
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  
  revalidatePath('/[locale]/backoffice/escalation', 'page');
}

export async function dismissEscalation(id: string, type: 'service_request' | 'incident' | 'maintenance') {
  const supabase = createClient();

  const table = type === 'service_request' ? 'service_requests' : 
                type === 'incident' ? 'incidents' : 'maintenance_work_orders';

  const { error } = await supabase
    .from(table)
    .update({ 
      current_escalation_level: null // Simply clear the escalation flag
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  
  revalidatePath('/[locale]/backoffice/escalation', 'page');
}
