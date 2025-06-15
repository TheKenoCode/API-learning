import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Shield, Trophy, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold tracking-tight mb-6">
            Welcome to{" "}
            <span className="text-primary">CarHub</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The premium marketplace for buying and selling exceptional vehicles. 
            Experience cars like never before with our 3D viewer and secure escrow system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose CarHub?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We combine cutting-edge technology with trusted marketplace practices 
            to create the ultimate car buying and selling experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>3D Car Viewer</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Examine every detail with our interactive 3D model viewer. 
                See cars from every angle before you buy.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Secure Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Protected transactions with our escrow system. 
                Your money is safe until the deal is complete.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Car Events</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Join exclusive car shows and contests. 
                Vote for your favorites and win prizes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Crypto Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Pay with traditional methods or cryptocurrency. 
                USDC and USD payments supported.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of car enthusiasts buying and selling on CarHub
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </section>
    </div>
  );
} 