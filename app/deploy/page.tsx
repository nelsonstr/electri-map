import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, CheckCircle } from "lucide-react"

export default function DeployPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-2">Deploy on Vercel</h1>
      <p className="text-center text-muted-foreground mb-8">
        Follow these steps to deploy your PowerCheck application on Vercel
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
          <CardDescription>Make sure you have the following before deploying</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc pl-5 space-y-2">
            <li>A GitHub, GitLab, or Bitbucket account with your project code</li>
            <li>A Vercel account (you can sign up for free at vercel.com)</li>
            <li>Your Supabase project details (URL and API keys)</li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Deployment Steps</h2>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">1. Push your code to a Git repository</h3>
            <p className="text-muted-foreground mb-2">
              Make sure your code is pushed to a GitHub, GitLab, or Bitbucket repository.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">2. Connect to Vercel</h3>
            <p className="text-muted-foreground mb-2">
              Go to{" "}
              <a
                href="https://vercel.com/new"
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                vercel.com/new
              </a>{" "}
              and import your Git repository.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">3. Configure environment variables</h3>
            <p className="text-muted-foreground mb-2">
              Add the following environment variables in the Vercel project settings:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>
                <code>NEXT_PUBLIC_SUPABASE_URL</code> - Your Supabase project URL
              </li>
              <li>
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> - Your Supabase anonymous key
              </li>
              <li>
                <code>SUPABASE_URL</code> - Your Supabase project URL (same as above)
              </li>
              <li>
                <code>SUPABASE_SERVICE_ROLE_KEY</code> - Your Supabase service role key
              </li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">4. Deploy</h3>
            <p className="text-muted-foreground mb-2">
              Click the "Deploy" button and wait for the deployment to complete.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">5. Visit your deployed application</h3>
            <p className="text-muted-foreground mb-2">
              Once the deployment is complete, you can visit your application at the URL provided by Vercel.
            </p>
          </div>
        </div>

        <Alert className="mt-8">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Tip</AlertTitle>
          <AlertDescription>
            Vercel automatically deploys updates when you push changes to your Git repository. You can also configure
            custom domains in the Vercel project settings.
          </AlertDescription>
        </Alert>

        <Alert className="mt-4" variant="default">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Environment Variables Checklist</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Make sure all these environment variables are properly set:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_URL</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
            <p className="mt-2 text-sm">
              The "supabaseUrl is required" error typically occurs when these variables are missing.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
