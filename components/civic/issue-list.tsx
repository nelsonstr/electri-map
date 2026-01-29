"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  User, 
  ChevronRight, 
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { CategoryBadge } from './category-selector';
import { StatusBadge } from './status-tracker';
import type { Issue } from '@/types/civic-issue';

interface IssueListProps {
  onIssueSelect?: (issue: Issue) => void;
  limit?: number;
  filterByStatus?: string[];
  filterByCategory?: string;
}

export function IssueList({ 
  onIssueSelect, 
  limit = 50,
  filterByStatus,
  filterByCategory 
}: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchIssues();
  }, [filterByStatus, filterByCategory]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterByStatus && filterByStatus.length > 0) {
        params.append('status', filterByStatus.join(','));
      } else if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (filterByCategory) {
        params.append('category', filterByCategory);
      } else if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      params.append('limit', limit.toString());

      const response = await fetch(`/api/issues?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setIssues(data.data);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="road_damage">Road Damage</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="water_supply">Water Supply</SelectItem>
              <SelectItem value="waste_management">Waste</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Filter className="h-12 w-12 mb-4 opacity-50" />
              <p>No issues found matching your criteria</p>
              <p className="text-sm mt-1">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card
              key={issue.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onIssueSelect?.(issue)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryBadge category={issue.category} size="sm" />
                      <StatusBadge status={issue.status} />
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {issue.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {issue.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">
                          {issue.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{issue.reporter_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Verification Count */}
                    {issue.verifications && issue.verifications.length > 0 && (
                      <div className="mt-3">
                        <Badge variant="secondary" className="text-xs">
                          {issue.verifications.length} verification(s)
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredIssues.length > 0 && filteredIssues.length >= limit && (
        <Button variant="outline" className="w-full" onClick={fetchIssues}>
          Load More
        </Button>
      )}
    </div>
  );
}
