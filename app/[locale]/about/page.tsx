import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
              <h1 className="text-4xl font-bold text-center mb-2">About Services Status</h1>
        <p className="text-center text-muted-foreground mb-8">
          Helping communities track and share infrastructure and utility service status
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Services Status was created to help communities during infrastructure and utility outages. By providing real-time
                crowdsourced information about service availability (electricity, water, gas, communications, mobile networks, and road conditions), 
                we help people make informed decisions and support each other during emergencies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Users can report their location and the status of various services (electricity, water, gas, communications, mobile networks, road blockages),
                which is displayed on our interactive map. This crowdsourced information helps others understand the extent of outages and find
                areas where services are available.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We respect your privacy. When you share your location, we only store the coordinates and service
                status. We don't collect personal information or track individual users. Your contributions help the
                community while maintaining your anonymity.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Get Involved</CardTitle>
                          <CardDescription>Help us improve Services Status and support your community</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Services Status is a community-driven project. The more people contribute, the more valuable it becomes for
                everyone. Here's how you can help:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Report service status regularly, especially during outages</li>
                <li>Share Services Status with friends, family, and neighbors</li>
                <li>Provide feedback to help us improve the platform</li>
                <li>Volunteer your skills if you're a developer, designer, or community organizer</li>
              </ul>
            </CardContent>
          </Card>
        </div>
              <div className="mt-12">
                  <Card>
                      <CardHeader>
              <CardTitle>Future Updates</CardTitle>
              <CardDescription>Share your features and suggestions</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ul className="list-disc pl-5 space-y-2">
                              <li>Planned maintenance notifications from service providers</li>
                              <li>Integration with IoT sensors for automated reporting</li>
                              <li>Historical outage data and analytics</li>
                              <li>Direct service provider notifications and two-way communication</li>
                              <li>AI-powered outage prediction based on historical patterns</li>
                              <li>Mobile app for iOS and Android</li>
                              <li>SMS/email alerts for service disruptions in your area</li>
                              <li>Community forums and discussion boards</li>
                              <li>Integration with emergency services and first responders</li>
                              <li>API access for third-party developers</li>
                              <li>Detailed outage reports with estimated restoration times</li>
                              <li>Multi-language support for global communities</li>
                          </ul>
                      </CardContent>
                  </Card>
              </div>
      </div>
    </main>
  )
}
