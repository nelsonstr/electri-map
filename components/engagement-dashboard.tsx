"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from "recharts"
import { 
  Zap, ZapOff, MapPin, Activity, AlertTriangle, TrendingUp, MessageSquare, 
  LayoutDashboard, Server, Globe 
} from "lucide-react"
import { 
  processServiceStats, 
  processTrendStats, 
  processGeographicStats, 
  analyzeTopics, 
  Location 
} from "@/lib/analytics"

type DashboardProps = {
  locations: Location[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function EngagementDashboard({ locations }: DashboardProps) {
  const [timeRange, setTimeRange] = useState("30") // default 30 days

  // Memoized stats to prevent recalculation on every render
  const stats = useMemo(() => {
    const days = parseInt(timeRange)
    return {
      services: processServiceStats({ locations, days }),
      trends: processTrendStats({ locations, days }),
      geography: processGeographicStats({ locations, days }),
      topics: analyzeTopics(locations), // Topics analyze all time for better context usually, or could filter
      total: locations.length
    }
  }, [locations, timeRange])

  // Calculate high-level summary metrics
  const summary = useMemo(() => {
    const totalReports = stats.services.reduce((acc, curr) => acc + curr.total, 0)
    const totalIssues = stats.services.reduce((acc, curr) => acc + curr.issue, 0)
    const issueRate = totalReports > 0 ? (totalIssues / totalReports) * 100 : 0
    
    return {
      totalReports,
      totalIssues,
      issueRate
    }
  }, [stats])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Engagement Dashboard</h2>
          <p className="text-muted-foreground">
            Insights into service availability and user feedback
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="0">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === '0' ? 'All time' : `Last ${timeRange} days`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              {summary.issueRate.toFixed(1)}% of total reports
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Service Issue</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
               {stats.services.length > 0 ? stats.services[0].name : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Most reported category
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geographic Spread</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.geography.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique locations/areas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="topics">Emerging Topics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Engagement Activity</CardTitle>
                <CardDescription>
                  Daily report volume over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={stats.trends}>
                    <defs>
                      <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="#8884d8" fillOpacity={1} fill="url(#colorReports)" />
                    <Area type="monotone" dataKey="issues" stroke="#ff8042" fillOpacity={1} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Service Distribution</CardTitle>
                <CardDescription>
                  Reports by service type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={stats.services}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="total"
                    >
                      {stats.services.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                         contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                         itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Performance Analysis</CardTitle>
              <CardDescription>Breakdown of working vs. reported issues by service type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.services} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                  <Bar dataKey="working" name="Functional" stackId="a" fill="#4ade80" />
                  <Bar dataKey="issue" name="Reported Issue" stackId="a" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Issue Frequency Trends</CardTitle>
              <CardDescription>Tracking reported issues over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats.trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="issues" name="Issues" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="reports" name="Total Reports" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Emerging Themes</CardTitle>
                        <CardDescription>Most frequent keywords in user reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {stats.topics.map((topic, i) => (
                                <div 
                                    key={i} 
                                    className="px-3 py-1 bg-secondary rounded-full text-sm font-medium flex items-center gap-2"
                                    style={{ opacity: Math.max(0.6, 1 - (i * 0.03)) }}
                                >
                                    {topic.text}
                                    <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-full text-xs">
                                        {topic.value}
                                    </span>
                                </div>
                            ))}
                            {stats.topics.length === 0 && (
                                <p className="text-muted-foreground italic">No sufficient data for topic analysis yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                         <CardTitle>Geographic Hotspots</CardTitle>
                         <CardDescription>Areas with highest report volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.geography.map((geo, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{geo.name}</p>
                                            <p className="text-xs text-muted-foreground">{geo.total} reports</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-red-500">{geo.issues} Issues</div>
                                    </div>
                                </div>
                            ))}
                             {stats.geography.length === 0 && (
                                <p className="text-muted-foreground italic">No geographic data available.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
