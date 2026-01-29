"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Users,
  MapPin,
  AlertTriangle,
  Loader2,
  Timer,
  Target,
  Zap,
  Truck,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryBadge } from './category-selector';
import type { IssueStats, IssueCategory } from '@/types/civic-issue';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#6b7280'];

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, trendValue }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && trendValue && (
          <div className={`flex items-center text-xs mt-2 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats?timeRange=${timeRange}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Transform data for charts
  const categoryData = stats ? Object.entries(stats.by_category).map(([key, value]) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  })) : [];

  const statusData = stats ? Object.entries(stats.by_status).map(([key, value]) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">City Operations Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor civic issue trends and department performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={stats?.total_reports || 0}
          icon={FileText}
          trend="up"
          trendValue="+12% from last month"
        />
        <StatCard
          title="Pending Reports"
          value={stats?.by_status.submitted || 0}
          icon={Clock}
          trend="down"
          trendValue="-5% from last month"
        />
        <StatCard
          title="Resolved"
          value={stats?.by_status.closed || 0}
          icon={CheckCircle2}
          trend="up"
          trendValue="+8% from last month"
        />
        <StatCard
          title="Avg. Response Time"
          value={`${(stats?.average_response_time_hours || 0).toFixed(1)}h`}
          icon={TrendingUp}
          trend="up"
          trendValue="-15% faster"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Support Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Issues by Category</CardTitle>
              <CardDescription>
                Distribution of reported issues across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>
                Current status of all reported issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Issue Trends</CardTitle>
              <CardDescription>
                Monthly trend of reported vs resolved issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { month: 'Jan', reported: 65, resolved: 45 },
                    { month: 'Feb', reported: 78, resolved: 52 },
                    { month: 'Mar', reported: 92, resolved: 68 },
                    { month: 'Apr', reported: 84, resolved: 72 },
                    { month: 'May', reported: 101, resolved: 85 },
                    { month: 'Jun', reported: 115, resolved: 98 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="reported" 
                      stackId="1" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6}
                      name="Reported"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="resolved" 
                      stackId="2" 
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.6}
                      name="Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Issue Heatmap</CardTitle>
              <CardDescription>
                Geographic distribution of reported issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-16 w-16 mx-auto mb-4" />
                  <p>Interactive heatmap coming soon</p>
                  <p className="text-sm">Showing concentration of issues by location</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support System Metrics Tab */}
        <TabsContent value="support" className="space-y-6">
          {/* Support KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">94%</p>
                    <p className="text-sm text-muted-foreground">SLA Compliance</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">2.4h</p>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  </div>
                  <Timer className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">87%</p>
                    <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Active Escalations</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SLA Compliance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>SLA Compliance by Category</CardTitle>
                <CardDescription>Percentage of requests meeting SLA targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { category: 'Street Light', compliance: 96 },
                      { category: 'Pothole', compliance: 88 },
                      { category: 'Traffic', compliance: 92 },
                      { category: 'Sidewalk', compliance: 85 },
                      { category: 'Waste', compliance: 98 },
                      { category: 'Water', compliance: 94 },
                      { category: 'Parks', compliance: 91 },
                      { category: 'Noise', compliance: 82 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="compliance" fill="#22c55e">
                        {[
                          { category: 'Street Light', compliance: 96 },
                          { category: 'Pothole', compliance: 88 },
                          { category: 'Traffic', compliance: 92 },
                          { category: 'Sidewalk', compliance: 85 },
                          { category: 'Waste', compliance: 98 },
                          { category: 'Water', compliance: 94 },
                          { category: 'Parks', compliance: 91 },
                          { category: 'Noise', compliance: 82 },
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.compliance >= 90 ? '#22c55e' : entry.compliance >= 80 ? '#f59e0b' : '#ef4444'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Request Resolution Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Request Resolution Trend</CardTitle>
                <CardDescription>Monthly resolution vs backlog</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month: 'Jan', resolved: 245, backlog: 89 },
                      { month: 'Feb', resolved: 268, backlog: 78 },
                      { month: 'Mar', resolved: 312, backlog: 65 },
                      { month: 'Apr', resolved: 289, backlog: 72 },
                      { month: 'May', resolved: 334, backlog: 58 },
                      { month: 'Jun', resolved: 367, backlog: 45 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Resolved" />
                      <Line type="monotone" dataKey="backlog" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Backlog" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>Team and equipment allocation across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { team: 'Street Maintenance', utilization: 85, available: 12 },
                  { team: 'Traffic Control', utilization: 72, available: 8 },
                  { team: 'Parks & Recreation', utilization: 68, available: 15 },
                  { team: 'Waste Management', utilization: 91, available: 5 },
                  { team: 'Water Services', utilization: 78, available: 10 },
                ].map((item) => (
                  <div key={item.team} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.team}</span>
                      <span className="text-sm text-muted-foreground">{item.utilization}% utilized</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.utilization >= 90 ? 'bg-red-500' : item.utilization >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${item.utilization}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Incident Response Times */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incident Response Times</CardTitle>
                <CardDescription>Average time to respond by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { severity: 'Critical', responseTime: 15, target: 30 },
                      { severity: 'High', responseTime: 35, target: 60 },
                      { severity: 'Medium', responseTime: 75, target: 120 },
                      { severity: 'Low', responseTime: 120, target: 240 },
                    ]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" unit=" min" />
                      <YAxis type="category" dataKey="severity" width={80} />
                      <Tooltip />
                      <Bar dataKey="responseTime" fill="#3b82f6" name="Actual" />
                      <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Communication Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Overview</CardTitle>
                <CardDescription>Messages sent by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'SMS', value: 1250 },
                          { name: 'Email', value: 890 },
                          { name: 'In-App', value: 456 },
                          { name: 'Phone', value: 234 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top Issues Section */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categories Requiring Attention</CardTitle>
          <CardDescription>
            Categories with the highest number of open issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
              .map((category, index) => (
                <div key={category.name} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {((category.value / (stats?.total_reports || 1)) * 100).toFixed(1)}% of all reports
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">{category.value} issues</span>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
