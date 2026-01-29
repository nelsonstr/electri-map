"use client";

import { useState } from 'react';
import { IssueList } from '@/components/civic/issue-list';
import { IssueReportForm } from '@/components/civic/issue-report-form';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Issue } from '@/types/civic-issue';

export default function IssuesPage() {
  const [showReportForm, setShowReportForm] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Community Issues</h1>
          <p className="text-muted-foreground mt-1">
            Browse and report issues in your community
          </p>
        </div>
        <Button onClick={() => setShowReportForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      <IssueList onIssueSelect={setSelectedIssue} />

      {/* Report Dialog */}
      <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report a New Issue</DialogTitle>
          </DialogHeader>
          <IssueReportForm 
            onSuccess={() => setShowReportForm(false)} 
            onCancel={() => setShowReportForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Issue Detail Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIssue?.title}</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <IssueDetail issue={selectedIssue} />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function IssueDetail({ issue }: { issue: Issue }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CategoryBadge category={issue.category} />
          <StatusBadge status={issue.status} />
        </div>
        <p className="text-muted-foreground mt-4">{issue.description}</p>
      </div>

      {/* Location */}
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Location</h3>
        <p className="text-sm">{issue.address || `${issue.location.latitude}, ${issue.location.longitude}`}</p>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="font-semibold mb-4">Status Timeline</h3>
        <StatusTracker 
          currentStatus={issue.status}
          timestamps={{
            created_at: issue.created_at,
            acknowledged_at: issue.acknowledged_at,
            started_at: issue.started_at,
            completed_at: issue.completed_at,
            verified_at: issue.verified_at,
            closed_at: issue.closed_at,
          }}
        />
      </div>

      {/* Reported By */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">Reported by</p>
          <p className="font-medium">{issue.reporter_name}</p>
        </div>
        <div className="text-right flex-1">
          <p className="text-sm text-muted-foreground">Reported on</p>
          <p className="font-medium">{new Date(issue.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

// Import missing components
import { CategoryBadge } from '@/components/civic/category-selector';
import { StatusTracker, StatusBadge } from '@/components/civic/status-tracker';
