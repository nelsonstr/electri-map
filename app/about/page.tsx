import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
              <h1 className="text-4xl font-bold text-center mb-2">About PowerCheck</h1>
        <p className="text-center text-muted-foreground mb-8">
          Helping communities track and share electricity availability
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                              PowerCheck was created to help communities during power outages and emergencies. By providing real-time
                information about electricity availability, we aim to help people make informed decisions and support
                each other during difficult times.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Users can report their current location and electricity status, which is then displayed on our
                interactive map. This crowdsourced information helps others understand the extent of outages and find
                areas where power is available.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We respect your privacy. When you share your location, we only store the coordinates and electricity
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
                          <CardDescription>Help us improve PowerCheck and support your community</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                              PowerCheck is a community-driven project. The more people contribute, the more valuable it becomes for
                everyone. Here's how you can help:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Report your electricity status regularly, especially during outages</li>
                              <li>Share PowerCheck with friends, family, and neighbors</li>
                <li>Provide feedback to help us improve the platform</li>
                <li>Volunteer your skills if you're a developer, designer, or community organizer</li>
              </ul>
            </CardContent>
          </Card>
        </div>
              <div className="mt-12">
                  <Card>
                      <CardHeader>
                          <CardTitle>Future updates</CardTitle>
                          <CardDescription>share your ideas and suggestions</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ul className="list-disc pl-5 space-y-2">
                              <li>Report your any service (gas, water, internet, etc.) outages</li>
                              <li>Planned maintenance</li>
                              <li>Sync with sensors</li>
                          </ul>
                      </CardContent>
                  </Card>
              </div>
      </div>
    </main>
  )
}
