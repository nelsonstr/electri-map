"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { cn, formatDate, calculateDistance, formatCurrency } from '@/lib/utils';
import { 
  Users, Truck, Search, MapPin, Clock, CheckCircle, 
  AlertTriangle, Wrench, X, Loader2, Navigation,
  Phone, Mail, Calendar, DollarSign, Star
} from 'lucide-react';

// Types
export interface Personnel {
  id: string;
  name: string;
  role: string;
  team: string;
  status: 'available' | 'assigned' | 'on_leave' | 'unavailable';
  skills: string[];
  location?: { latitude: number; longitude: number; address?: string };
  phone?: string;
  rating?: number;
  hourly_rate?: number;
  current_assignment?: {
    type: string;
    id: string;
    title: string;
    estimated_completion?: string;
  };
}

export interface Equipment {
  id: string;
  name: string;
  type: 'vehicle' | 'tool' | 'heavy_machinery' | 'safety_equipment';
  status: 'available' | 'in_use' | 'maintenance';
  location?: { latitude: number; longitude: number; address?: string };
  hourly_rate?: number;
  current_assignment?: {
    type: string;
    id: string;
    assigned_to?: string;
    estimated_return?: string;
  };
}

export interface TaskLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ResourceAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskType: 'service_request' | 'incident' | 'maintenance';
  taskId: string;
  taskTitle: string;
  taskLocation: TaskLocation;
  requiredSkills?: string[];
  requiredEquipmentTypes?: string[];
  personnel?: Personnel[];
  equipment?: Equipment[];
  onAssign?: (personnelIds: string[], equipmentIds: string[]) => void;
}

const equipmentTypeIcons: Record<string, React.ElementType> = {
  vehicle: Truck,
  tool: Wrench,
  heavy_machinery: AlertTriangle,
  safety_equipment: AlertTriangle,
};

export function ResourceAllocationModal({
  open,
  onOpenChange,
  taskType,
  taskId,
  taskTitle,
  taskLocation,
  requiredSkills = [],
  requiredEquipmentTypes = [],
  personnel = [],
  equipment = [],
  onAssign
}: ResourceAllocationModalProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('personnel');
  const [assigning, setAssigning] = useState(false);

  // Filter and sort personnel by relevance
  const filteredPersonnel = useMemo(() => {
    return personnel
      .filter(p => p.status === 'available')
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      })
      .map(p => {
        // Calculate skill match score
        const matchingSkills = p.skills.filter(s => 
          requiredSkills.some(req => s.toLowerCase().includes(req.toLowerCase()))
        );
        const skillMatchScore = requiredSkills.length > 0 
          ? (matchingSkills.length / requiredSkills.length) * 100 
          : 100;

        // Calculate distance if location available
        let distance = null;
        if (p.location && taskLocation) {
          distance = calculateDistance(
            p.location.latitude, p.location.longitude,
            taskLocation.latitude, taskLocation.longitude
          );
        }

        return { ...p, skillMatchScore, distance };
      })
      .sort((a, b) => {
        // Sort by skill match first, then by distance
        if (b.skillMatchScore !== a.skillMatchScore) {
          return b.skillMatchScore - a.skillMatchScore;
        }
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [personnel, searchQuery, requiredSkills, taskLocation]);

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    return equipment
      .filter(e => e.status === 'available')
      .filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .filter(e => {
        if (requiredEquipmentTypes.length === 0) return true;
        return requiredEquipmentTypes.some(req => 
          e.type.toLowerCase().includes(req.toLowerCase())
        );
      })
      .map(e => {
        let distance = null;
        if (e.location && taskLocation) {
          distance = calculateDistance(
            e.location.latitude, e.location.longitude,
            taskLocation.latitude, taskLocation.longitude
          );
        }
        return { ...e, distance };
      })
      .sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [equipment, searchQuery, requiredEquipmentTypes, taskLocation]);

  // Calculate cost estimates
  const costEstimate = useMemo(() => {
    const personnelCost = selectedPersonnel.reduce((total, id) => {
      const person = personnel.find(p => p.id === id);
      return total + (person?.hourly_rate || 0) * 4; // Assume 4 hour task
    }, 0);
    
    const equipmentCost = selectedEquipment.reduce((total, id) => {
      const item = equipment.find(e => e.id === id);
      return total + (item?.hourly_rate || 0) * 4;
    }, 0);

    return personnelCost + equipmentCost;
  }, [selectedPersonnel, selectedEquipment, personnel, equipment]);

  const handleTogglePersonnel = (id: string) => {
    setSelectedPersonnel(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleToggleEquipment = (id: string) => {
    setSelectedEquipment(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      onAssign?.(selectedPersonnel, selectedEquipment);
      toast({
        title: 'Resources Assigned',
        description: `Assigned ${selectedPersonnel.length} personnel and ${selectedEquipment.length} equipment items.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign resources',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedPersonnel([]);
    setSelectedEquipment([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Allocate Resources</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{taskType.replace('_', ' ')}:</span>
            <span className="font-medium text-foreground">{taskTitle}</span>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Cost Estimate */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Estimated Cost</span>
              </div>
              <span className="text-xl font-bold">{formatCurrency(costEstimate)}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{selectedPersonnel.length} personnel selected</span>
              <span>{selectedEquipment.length} equipment selected</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
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
          <TabsContent value="personnel" className="flex-1 overflow-y-auto mt-4">
            {requiredSkills.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Required skills:</span>
                {requiredSkills.map(skill => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {filteredPersonnel.map(person => (
                <Card 
                  key={person.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedPersonnel.includes(person.id) && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleTogglePersonnel(person.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <Checkbox 
                        checked={selectedPersonnel.includes(person.id)}
                        onCheckedChange={() => handleTogglePersonnel(person.id)}
                        className="mt-1"
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{person.name}</h4>
                            <p className="text-sm text-muted-foreground">{person.role} • {person.team}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {person.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm">{person.rating}</span>
                              </div>
                            )}
                            {person.hourly_rate && (
                              <Badge variant="outline">{formatCurrency(person.hourly_rate)}/hr</Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {person.skills.map(skill => {
                            const isRequired = requiredSkills.some(req => 
                              skill.toLowerCase().includes(req.toLowerCase())
                            );
                            return (
                              <Badge 
                                key={skill} 
                                variant={isRequired ? "default" : "outline"}
                                className={cn(isRequired && "bg-green-600")}
                              >
                                {skill}
                              </Badge>
                            );
                          })}
                        </div>

                        {/* Location and Distance */}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {person.distance !== null && (
                            <div className="flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              <span>{person.distance.toFixed(1)} km away</span>
                            </div>
                          )}
                          {person.location?.address && (
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{person.location.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Current Assignment */}
                        {person.current_assignment && (
                          <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Currently assigned: {person.current_assignment.title}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPersonnel.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No available personnel found
                </div>
              )}
            </div>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="flex-1 overflow-y-auto mt-4">
            {requiredEquipmentTypes.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Required types:</span>
                {requiredEquipmentTypes.map(type => (
                  <Badge key={type} variant="outline">{type}</Badge>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {filteredEquipment.map(item => {
                const TypeIcon = equipmentTypeIcons[item.type] || Truck;
                return (
                  <Card 
                    key={item.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedEquipment.includes(item.id) && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleToggleEquipment(item.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <Checkbox 
                          checked={selectedEquipment.includes(item.id)}
                          onCheckedChange={() => handleToggleEquipment(item.id)}
                          className="mt-1"
                        />
                        <div className="p-2 bg-muted rounded-lg">
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground capitalize">{item.type.replace('_', ' ')}</p>
                            </div>
                            {item.hourly_rate && (
                              <Badge variant="outline">{formatCurrency(item.hourly_rate)}/hr</Badge>
                            )}
                          </div>

                          {/* Location and Distance */}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {item.distance !== null && (
                              <div className="flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                <span>{item.distance.toFixed(1)} km away</span>
                              </div>
                            )}
                            {item.location?.address && (
                              <div className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{item.location.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredEquipment.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No available equipment found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={assigning || (selectedPersonnel.length === 0 && selectedEquipment.length === 0)}
          >
            {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign Resources
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
