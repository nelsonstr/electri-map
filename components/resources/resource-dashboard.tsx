"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatDate } from '@/lib/utils';
import { 
  Users, Truck, Hammer, Wrench, Clock, MapPin, 
  CheckCircle, AlertCircle, Search, Filter, RefreshCw,
  UserPlus, UserMinus, Calendar, Phone, Mail
} from 'lucide-react';

// Types
export interface Personnel {
  id: string;
  name: string;
  role: string;
  team: string;
  status: 'available' | 'assigned' | 'on_leave' | 'unavailable';
  skills: string[];
  current_assignment?: {
    type: 'service_request' | 'incident' | 'maintenance';
    id: string;
    title: string;
    location?: string;
    estimated_completion?: string;
  };
  phone?: string;
  email?: string;
  avatar_url?: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'vehicle' | 'tool' | 'heavy_machinery' | 'safety_equipment';
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  location?: string;
  current_assignment?: {
    type: string;
    id: string;
    assigned_to?: string;
    estimated_return?: string;
  };
  last_maintenance?: string;
  next_maintenance?: string;
  serial_number?: string;
}

interface ResourceDashboardProps {
  personnel?: Personnel[];
  equipment?: Equipment[];
  onRefresh?: () => void;
  onAssignPersonnel?: (personnelId: string, taskType: string, taskId: string) => void;
  onAssignEquipment?: (equipmentId: string, taskType: string, taskId: string) => void;
  onReturnEquipment?: (equipmentId: string) => void;
}

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  available: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Available' },
  assigned: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock, label: 'Assigned' },
  on_leave: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Calendar, label: 'On Leave' },
  unavailable: { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle, label: 'Unavailable' },
  in_use: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Wrench, label: 'In Use' },
  maintenance: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Hammer, label: 'Maintenance' },
  out_of_service: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertCircle, label: 'Out of Service' },
};

const equipmentTypeIcons: Record<string, React.ElementType> = {
  vehicle: Truck,
  tool: Wrench,
  heavy_machinery: Hammer,
  safety_equipment: AlertCircle,
};

export function ResourceDashboard({ 
  personnel = [], 
  equipment = [],
  onRefresh,
  onAssignPersonnel,
  onAssignEquipment,
  onReturnEquipment
}: ResourceDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('personnel');

  const filteredPersonnel = useMemo(() => {
    return personnel.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [personnel, searchQuery, filterStatus]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [equipment, searchQuery, filterStatus]);

  // Calculate statistics
  const personnelStats = useMemo(() => ({
    total: personnel.length,
    available: personnel.filter(p => p.status === 'available').length,
    assigned: personnel.filter(p => p.status === 'assigned').length,
    onLeave: personnel.filter(p => p.status === 'on_leave').length,
    utilization: personnel.length > 0 
      ? Math.round((personnel.filter(p => p.status === 'assigned').length / personnel.length) * 100) 
      : 0,
  }), [personnel]);

  const equipmentStats = useMemo(() => ({
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    inUse: equipment.filter(e => e.status === 'in_use').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
    utilization: equipment.length > 0 
      ? Math.round((equipment.filter(e => e.status === 'in_use').length / equipment.length) * 100) 
      : 0,
  }), [equipment]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resource Dashboard</h1>
          <p className="text-muted-foreground">Monitor personnel and equipment availability</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Personnel Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{personnelStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Personnel</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Available</span>
                <span className="font-medium text-green-600">{personnelStats.available}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Assigned</span>
                <span className="font-medium text-blue-600">{personnelStats.assigned}</span>
              </div>
              <Progress value={personnelStats.utilization} className="h-2" />
              <p className="text-xs text-muted-foreground">{personnelStats.utilization}% utilization</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{personnelStats.available}</p>
                <p className="text-sm text-muted-foreground">Available Now</p>
              </div>
            </div>
            <div className="mt-4">
              <Badge className="bg-yellow-100 text-yellow-700">
                {personnelStats.onLeave} on leave
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{equipmentStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Equipment</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>In Use</span>
                <span className="font-medium text-blue-600">{equipmentStats.inUse}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Maintenance</span>
                <span className="font-medium text-orange-600">{equipmentStats.maintenance}</span>
              </div>
              <Progress value={equipmentStats.utilization} className="h-2" />
              <p className="text-xs text-muted-foreground">{equipmentStats.utilization}% utilization</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{equipmentStats.available}</p>
                <p className="text-sm text-muted-foreground">Equipment Available</p>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="outline">
                {equipmentStats.total - equipmentStats.available - equipmentStats.inUse} other
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personnel or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_use">In Use</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personnel" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personnel ({filteredPersonnel.length})
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Equipment ({filteredEquipment.length})
          </TabsTrigger>
        </TabsList>

        {/* Personnel Tab */}
        <TabsContent value="personnel" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPersonnel.map(person => {
              const status = statusConfig[person.status];
              return (
                <Card key={person.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={person.avatar_url} />
                        <AvatarFallback>{person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate">{person.name}</h3>
                          <Badge className={cn(status.bgColor, status.color)}>
                            <status.icon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{person.role}</p>
                        <p className="text-sm text-muted-foreground">{person.team}</p>
                      </div>
                    </div>
                    
                    {/* Skills */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {person.skills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {person.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{person.skills.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Current Assignment */}
                    {person.current_assignment && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">Current Assignment</span>
                        </div>
                        <p className="text-sm font-medium truncate">{person.current_assignment.title}</p>
                        {person.current_assignment.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{person.current_assignment.location}</span>
                          </div>
                        )}
                        {person.current_assignment.estimated_completion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Est. completion: {formatDate(person.current_assignment.estimated_completion)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Contact Info */}
                    {(person.phone || person.email) && (
                      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                        {person.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                        {person.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{person.email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {filteredPersonnel.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No personnel found matching your search
              </div>
            )}
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map(item => {
              const status = statusConfig[item.status];
              const TypeIcon = equipmentTypeIcons[item.type] || Wrench;
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          <Badge className={cn(status.bgColor, status.color)}>
                            <status.icon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{item.type.replace('_', ' ')}</p>
                        {item.serial_number && (
                          <p className="text-xs text-muted-foreground">SN: {item.serial_number}</p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {item.location && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{item.location}</span>
                      </div>
                    )}

                    {/* Current Assignment */}
                    {item.current_assignment && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">Currently Assigned</span>
                        </div>
                        <p className="text-sm font-medium">{item.current_assignment.type}</p>
                        {item.current_assignment.assigned_to && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Assigned to: {item.current_assignment.assigned_to}
                          </p>
                        )}
                        {item.current_assignment.estimated_return && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Est. return: {formatDate(item.current_assignment.estimated_return)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Maintenance Info */}
                    {(item.last_maintenance || item.next_maintenance) && (
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        {item.last_maintenance && (
                          <span>Last maintenance: {formatDate(item.last_maintenance)}</span>
                        )}
                        {item.next_maintenance && (
                          <span className={new Date(item.next_maintenance) < new Date() ? "text-red-500" : ""}>
                            Next: {formatDate(item.next_maintenance)}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {filteredEquipment.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No equipment found matching your search
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
