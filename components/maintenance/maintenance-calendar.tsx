"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { cn, formatDate, isSameDay, getWeekDates, getMonthDates } from '@/lib/utils';

// Types
export interface MaintenanceTask {
  id: string;
  title: string;
  type: 'preventive' | 'predictive' | 'emergency' | 'corrective';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  location?: { latitude: number; longitude: number; address?: string };
  assigned_team?: string;
  assigned_personnel?: string[];
  work_order_number?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

interface MaintenanceCalendarProps {
  tasks: MaintenanceTask[];
  onTaskClick?: (task: MaintenanceTask) => void;
  onDateSelect?: (date: Date) => void;
  onCreateTask?: () => void;
}

// Type configuration
const typeConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  preventive: { color: 'text-green-600', bgColor: 'bg-green-100', icon: Calendar, label: 'Preventive' },
  predictive: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Calendar, label: 'Predictive' },
  emergency: { color: 'text-red-600', bgColor: 'bg-red-100', icon: Clock, label: 'Emergency' },
  corrective: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock, label: 'Corrective' },
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  scheduled: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Scheduled' },
  in_progress: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'In Progress' },
  completed: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Completed' },
  cancelled: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Cancelled' },
};

export function MaintenanceCalendar({ 
  tasks, 
  onTaskClick, 
  onDateSelect,
  onCreateTask 
}: MaintenanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    if (selectedType === 'all') return tasks;
    return tasks.filter(task => task.type === selectedType);
  }, [tasks, selectedType]);

  const calendarDays = useMemo(() => {
    if (view === 'month') {
      return getMonthDates(currentDate);
    } else if (view === 'week') {
      return getWeekDates(currentDate);
    } else {
      return [currentDate];
    }
  }, [currentDate, view]);

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.end_date);
      return date >= taskStart && date <= taskEnd;
    });
  };

  const formatHeader = () => {
    if (view === 'month') {
      return formatDate(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      const weekDates = getWeekDates(currentDate);
      return `${formatDate(weekDates[0], 'MMM d')} - ${formatDate(weekDates[6], 'MMM d, yyyy')}`;
    } else {
      return formatDate(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Maintenance Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="preventive">Preventive</SelectItem>
                <SelectItem value="predictive">Predictive</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="corrective">Corrective</SelectItem>
              </SelectContent>
            </Select>
            <Select value={view} onValueChange={(v) => setView(v as 'month' | 'week' | 'day')}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{formatHeader()}</h2>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week day headers (for month/week view) */}
        {view !== 'day' && (
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
        )}

        {/* Calendar grid */}
        <div className={cn(
          'grid gap-1',
          view === 'month' ? 'grid-cols-7' : 
          view === 'week' ? 'grid-cols-7' : 'grid-cols-1'
        )}>
          {calendarDays.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const isToday = isSameDay(date, new Date());
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors',
                  'hover:bg-muted/50',
                  isToday && 'bg-primary/5 border-primary',
                  !isCurrentMonth && view === 'month' && 'opacity-50'
                )}
                onClick={() => onDateSelect?.(date)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-sm font-medium',
                    isToday && 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center'
                  )}>
                    {formatDate(date, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayTasks.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => {
                    const type = typeConfig[task.type];
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'text-xs p-1 rounded truncate cursor-pointer',
                          type.bgColor,
                          'hover:opacity-80'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(task);
                        }}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-1">
                      +{dayTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          {Object.entries(typeConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', config.bgColor.replace('bg-', 'bg-'))} />
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Task detail card for sidebar
export function MaintenanceTaskCard({ 
  task, 
  onClick 
}: { 
  task: MaintenanceTask; 
  onClick?: () => void;
}) {
  const type = typeConfig[task.type];
  const status = statusConfig[task.status];

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge className={cn(type.bgColor, type.color)}>
            {type.label}
          </Badge>
          <Badge variant="outline" className={cn(status.bgColor, status.color)}>
            {status.label}
          </Badge>
        </div>
        <h3 className="font-medium mb-2">{task.title}</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.start_date, 'MMM d')} - {formatDate(task.end_date, 'MMM d')}</span>
          </div>
          {task.location?.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{task.location.address}</span>
            </div>
          )}
          {task.assigned_team && (
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>{task.assigned_team}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
