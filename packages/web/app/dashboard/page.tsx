import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">
          Welcome to your dashboard!
        </h2>
        <p className="text-muted-foreground">
          You are successfully authenticated with Clerk. Your user ID is:{" "}
          {userId}
        </p>
        <div className="mt-6 p-4 bg-muted rounded-md">
          <h3 className="font-semibold mb-2">What you can do here:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Manage your car listings</li>
            <li>View your purchase history</li>
            <li>Participate in car events</li>
            <li>Update your profile settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
