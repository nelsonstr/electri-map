// Emergency Command Center Dashboard
// Phase 1: Core Infrastructure
// Main dashboard for emergency operations center

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EmergencyIncident } from '@/types/emergency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IncidentList } from './incident-list'
import { IncidentReportForm } from './incident-report-form'
import { 
  Siren, 
  AlertTriangle, 
  Users, 
  Clock, 
  MapPin, 
  Activity, 
  Radio,
  Phone,
  Map,
  FileText,
  Settings,
  Plus,
  RefreshCw
} from 'lucide-react'

// Stats card component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  trendUp = true,
  color = 'primary'
}: {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  trendUp?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    danger: 'bg-red-500/10 text-red-500',
    info: 'bg-blue-500/10 text-blue-500'
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p className={`text-sm mt-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                {trend} from last hour
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Activity feed component
function ActivityFeed() {
  const activities = [
    { id: 1, type: 'incident', message: 'New fire incident reported in Lisbon', time: '2 min ago', severity: 'critical' },
    { id: 2, type: 'status', message: 'Incident #2024-0086 escalated to major', time: '5 min ago', severity: 'major' },
    { id: 3, type: 'resource', message: 'Engine 7 dispatched to flood zone', time: '8 min ago', severity: 'info' },
    { id: 4, type: 'communication', message: 'Evacuation order issued for Zone A', time: '12 min ago', severity: 'warning' },
    { id: 5, type: 'status', message: 'Incident #2024-0084 contained', time: '18 min ago', severity: 'success' }
  ]
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex gap-3 text-sm">
              <div className={`w-2 h-2 mt-2 rounded-full ${
                activity.severity === 'critical' ? 'bg-red-500' :
                activity.severity === 'major' ? 'bg-orange-500' :
                activity.severity === 'warning' ? 'bg-yellow-500' :
                activity.severity === 'success' ? 'bg-green-500' :
                'bg-blue-500'
              }`} />
              <div className="flex-1">
                <p>{activity.message}</p>
                <p className="text-muted-foreground text-xs">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Agency status component
function AgencyStatus() {
  const agencies = [
    { name: 'Fire Brigade', status: 'operational', units: 12, available: 8 },
    { name: 'Medical Services', status: 'busy', units: 8, available: 3 },
    { name: 'Police', status: 'operational', units: 20, available: 15 },
    { name: 'Civil Protection', status: 'operational', units: 5, available: 2 },
    { name: 'Military', status: 'standby', units: 10, available: 10 }
  ]
  
  const statusColors = {
    operational: 'bg-green-500',
    busy: 'bg-yellow-500',
    standby: 'bg-blue-500',
    unavailable: 'bg-red-500'
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Agency Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agencies.map(agency => (
            <div key={agency.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[agency.status as keyof typeof statusColors]}`} />
                <span className="font-medium">{agency.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {agency.available}/{agency.units} available
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Quick actions component
function QuickActions({ onNewIncident }: { onNewIncident: () => void }) {
  const actions = [
    { icon: Plus, label: 'New Incident', action: onNewIncident, color: 'bg-red-500 hover:bg-red-600' },
    { icon: Phone, label: 'Emergency Call', action: () => {}, color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: Radio, label: 'Radio Check', action: () => {}, color: 'bg-green-500 hover:bg-green-600' },
    { icon: Map, label: 'View Map', action: () => {}, color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: FileText, label: 'Generate Report', action: () => {}, color: 'bg-gray-500 hover:bg-gray-600' },
    { icon: Settings, label: 'Settings', action: () => {}, color: 'bg-gray-400 hover:bg-gray-500' }
  ]
  
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {actions.map(action => (
        <Button
          key={action.label}
          variant="secondary"
          className={`${action.color} text-white`}
          onClick={action.action}
        >
          <action.icon className="h-4 w-4 mr-1" />
          {action.label}
        </Button>
      ))}
    </div>
  )
}

// Mini map component placeholder
function MiniMap({ incidents }: { incidents: EmergencyIncident[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Incident Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-lg h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Interactive map view</p>
            <p className="text-sm">{incidents.length} active incidents</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Weather widget component
function WeatherWidget() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Weather Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-4xl font-bold">18°C</div>
          <div className="text-muted-foreground">Partly Cloudy</div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Wind</p>
              <p className="font-medium">15 km/h NW</p>
            </div>
            <div>
              <p className="text-muted-foreground">Humidity</p>
              <p className="font-medium">65%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Alert banner for critical incidents
function CriticalAlertBanner({ incidents }: { incidents: EmergencyIncident[] }) {
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed')
  
  if (criticalIncidents.length === 0) return null
  
  return (
    <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-bold">{criticalIncidents.length} Critical Incident(s) Active</span>
      </div>
      <div className="flex items-center gap-4">
        {criticalIncidents.slice(0, 3).map(incident => (
          <span key={incident.id} className="text-sm hidden sm:inline">
            {incident.incidentNumber}: {incident.title}
          </span>
        ))}
        <Button variant="secondary" size="sm" className="bg-white text-red-500 hover:bg-gray-100">
          View All
        </Button>
      </div>
    </div>
  )
}

interface CommandCenterDashboardProps {
  initialIncidents?: EmergencyIncident[]
}

export function CommandCenterDashboard({ initialIncidents = [] }: CommandCenterDashboardProps) {
  const [incidents, setIncidents] = useState<EmergencyIncident[]>(initialIncidents)
  const [activeView, setActiveView] = useState<'list' | 'map' | 'new-incident'>('list')
  const [stats, setStats] = useState({
    activeIncidents: 0,
    criticalIncidents: 0,
    unitsDispatched: 0,
    avgResponseTime: 0
  })
  
  const supabase = createClient()
  
  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/emergency/incidents/stats')
        const data = await response.json()
        
        if (data.success) {
          setStats({
            activeIncidents: data.data.total,
            criticalIncidents: data.data.bySeverity.critical || 0,
            unitsDispatched: 15,
            avgResponseTime: 8.5
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    
    fetchStats()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('command-center-stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'emergency',
        table: 'incidents'
      }, () => {
        fetchStats()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])
  
  const handleIncidentClick = (incident: EmergencyIncident) => {
    // Navigate to incident detail
    console.log('Incident clicked:', incident.id)
  }
  
  const handleNewIncident = () => {
    setActiveView('new-incident')
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Critical Alert Banner */}
      {stats.criticalIncidents > 0 && (
        <CriticalAlertBanner incidents={incidents} />
      )}
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <Siren className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Emergency Command Center</h1>
                <p className="text-sm text-muted-foreground">Operations Status: Active</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Quick Actions */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-3">
          <QuickActions onNewIncident={handleNewIncident} />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Active Incidents"
            value={stats.activeIncidents}
            icon={AlertTriangle}
            trend="+3"
            trendUp={false}
            color="danger"
          />
          <StatsCard
            title="Critical"
            value={stats.criticalIncidents}
            icon={Siren}
            color="danger"
          />
          <StatsCard
            title="Units Dispatched"
            value={stats.unitsDispatched}
            icon={Users}
            trend="+5"
            color="warning"
          />
          <StatsCard
            title="Avg Response Time"
            value={`${stats.avgResponseTime} min`}
            icon={Clock}
            trend="-1.2 min"
            trendUp={true}
            color="success"
          />
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant={activeView === 'list' ? 'default' : 'outline'}
            onClick={() => setActiveView('list')}
          >
            List View
          </Button>
          <Button 
            variant={activeView === 'map' ? 'default' : 'outline'}
            onClick={() => setActiveView('map')}
          >
            Map View
          </Button>
          <Button 
            variant={activeView === 'new-incident' ? 'default' : 'outline'}
            onClick={() => setActiveView('new-incident')}
          >
            New Report
          </Button>
        </div>
        
        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Incidents Section */}
          <div className="lg:col-span-2">
            {activeView === 'list' && (
              <IncidentList 
                onIncidentClick={handleIncidentClick}
                showActiveOnly={true}
              />
            )}
            
            {activeView === 'map' && (
              <MiniMap incidents={incidents} />
            )}
            
            {activeView === 'new-incident' && (
              <IncidentReportForm
                onSuccess={(incidentId) => {
                  setActiveView('list')
                  // Optionally navigate to the new incident
                }}
                onCancel={() => setActiveView('list')}
              />
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <ActivityFeed />
            <AgencyStatus />
            <WeatherWidget />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              System Online
            </span>
            <span>|</span>
            <span>Server: dc-01</span>
            <span>|</span>
            <span>Latency: 23ms</span>
          </div>
          <div>
            v1.0.0 - Build 2024.02.07
          </div>
        </div>
      </footer>
    </div>
  )
}
