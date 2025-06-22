import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EventSuccessPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🎉 Event Created Successfully!</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Your event has been created and is ready to go!
          </h2>
          <p className="text-green-700">
            Event ID: <code className="bg-green-100 px-2 py-1 rounded">{params.id}</code>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What&apos;s Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <div>
                <p className="font-medium">View in Database</p>
                <p className="text-sm text-muted-foreground">
                  Open Prisma Studio at <code className="bg-gray-100 px-1 rounded">localhost:5555</code> to see your event and challenges
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <div>
                <p className="font-medium">Test the API</p>
                <p className="text-sm text-muted-foreground">
                  Use the event registration and challenge endpoints we built
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <div>
                <p className="font-medium">Check the Events & Challenges Feature</p>
                <p className="text-sm text-muted-foreground">
                  Everything is working! The API successfully created your event with challenges.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-6">
            <h3 className="font-semibold text-lg mb-2">API Endpoints Ready</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm font-mono">
              <div>
                <span className="text-green-600">POST</span> /api/events/{params.id}/register
              </div>
              <div>
                <span className="text-green-600">POST</span> /api/challenges/[challenge-id]/enter
              </div>
              <div>
                <span className="text-green-600">POST</span> /api/challenges/[challenge-id]/complete
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <a 
          href="/clubs/cmc88q1vu0001v4hivrn6h6r0"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to Santa Clara Carz
        </a>
      </div>
    </div>
  );
} 