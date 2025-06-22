"use client";

import { motion } from "framer-motion";
import {
  Car,
  Trophy,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Camera,
  Gamepad2,
  CreditCard,
  Crown,
  MapPin,
  Timer,
  Flame,
  Target,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CarModelViewer from "@/components/CarModelViewer";
import CountdownTimer from "@/components/marketing/CountdownTimer";
import BrandIcon from "@/components/marketing/BrandIcon";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const glowPulse = {
  initial: { boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)" },
  animate: {
    boxShadow: [
      "0 0 20px rgba(239, 68, 68, 0.3)",
      "0 0 40px rgba(239, 68, 68, 0.6)",
      "0 0 20px rgba(239, 68, 68, 0.3)",
    ],
    transition: { duration: 2, repeat: Infinity },
  },
};

export default function HomePage() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/landing/hero-video.mp4" type="video/mp4" />
            {/* TODO: Add hero video of underground night meet with neon underglow */}
          </video>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <motion.div
          className="relative z-10 text-center px-4 max-w-5xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-4 rounded-full blur-xl"
                variants={glowPulse}
                initial="initial"
                animate="animate"
              />
              <BrandIcon className="relative w-20 h-20 mx-auto mb-6 text-red-500" />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="block text-red-500 text-6xl md:text-8xl lg:text-9xl font-black">
              REDLINE
            </span>
            <span className="block text-white/80 text-2xl md:text-3xl font-normal tracking-widest mt-2">
              P L A T F O R M
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            The Underground Revolution
          </motion.p>

          <motion.p
            className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            Create your crew. Dominate your territory. Build your legend. Where
            automotive culture meets competitive community.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-600/40 hover:shadow-red-600/60 transition-all duration-300 text-lg px-8 py-6"
            >
              <Link href="/clubs/create" className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                START YOUR CLUB
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 text-lg px-8 py-6"
            >
              <Link href="/leaderboards" className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                VIEW RANKINGS
              </Link>
            </Button>
          </motion.div>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-sm px-4 py-2">
              🔥 127 Active Clubs • 2,847 Members Online
            </Badge>
          </motion.div>
        </motion.div>
      </section>

      {/* Territory Control Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-red-950/20">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 mb-4 text-sm">
              TERRITORIAL DOMINANCE
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Own Your <span className="text-red-500">Streets</span>
            </h2>
            <p className="text-white/70 text-xl max-w-3xl mx-auto">
              Create exclusive clubs, challenge rival crews, and establish your
              dominance across cities. This isn&apos;t just competition—it&apos;s
              digital street sovereignty.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Crown,
                title: "Club Empire",
                description:
                  "Create your crew, recruit members, establish territory",
                stats: "1,247 Active Clubs",
              },
              {
                icon: MapPin,
                title: "Local Domination",
                description:
                  "City-specific leaderboards and territorial challenges",
                stats: "89 Cities Conquered",
              },
              {
                icon: Target,
                title: "Challenge System",
                description: "Pre-built contests + custom crew challenges",
                stats: "15,632 Challenges Live",
              },
              {
                icon: Flame,
                title: "Street Cred",
                description: "Reputation system that matters in the real world",
                stats: "Top 500 Legends",
              },
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="bg-black/60 border-red-500/20 hover:border-red-500/50 transition-all duration-300 group backdrop-blur-sm h-full">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors border border-red-500/30">
                      <feature.icon className="w-8 h-8 text-red-500" />
                    </div>
                    <CardTitle className="text-red-500 text-xl font-bold">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-white/70 mb-3">
                      {feature.description}
                    </CardDescription>
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                      {feature.stats}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Leaderboards Section */}
      <section className="py-24 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-6"
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              <div>
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 mb-4">
                  LIVE RANKINGS
                </Badge>
                <h3 className="text-4xl md:text-5xl font-bold mb-4">
                  Prove Your <span className="text-red-500">Dominance</span>
                </h3>
                <p className="text-white/70 text-xl mb-6">
                  Real-time dyno leaderboards, local crew rankings, and
                  territory control. Every run counts. Every win matters. Every
                  loss is remembered.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: Zap,
                    text: "Live Dyno Leaderboards by City",
                    badge: "Real-time",
                  },
                  {
                    icon: Crown,
                    text: "Club Territorial Rankings",
                    badge: "Updated Daily",
                  },
                  {
                    icon: Target,
                    text: "Challenge Win/Loss Records",
                    badge: "Permanent",
                  },
                  {
                    icon: Timer,
                    text: "Track Time Attack Boards",
                    badge: "Verified",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-red-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="text-white/90 font-medium">
                        {feature.text}
                      </span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  asChild
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Link href="/leaderboards">View All Rankings</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-red-500/30 text-red-500 hover:bg-red-500 hover:border-red-500 hover:text-white"
                >
                  <Link href="/dyno-submit">Submit Your Run</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div {...fadeInUp}>
              <div className="relative">
                <div className="absolute -inset-4 bg-red-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-black/80 rounded-xl p-6 border border-red-500/30 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 font-bold">
                        ST. LOUIS DYNO KINGS
                      </span>
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                        🔴 LIVE
                      </Badge>
                    </div>

                    {[
                      {
                        rank: "👑",
                        name: "BLACKOUT_STI",
                        club: "MIDNIGHT RUNNERS",
                        hp: "847 HP",
                        verified: true,
                      },
                      {
                        rank: "🥈",
                        name: "REDLINE_R34",
                        club: "TOKYO DRIFT STL",
                        hp: "823 HP",
                        verified: true,
                      },
                      {
                        rank: "🥉",
                        name: "BOOST_DEMON",
                        club: "TURBO MAFIA",
                        hp: "791 HP",
                        verified: false,
                      },
                      {
                        rank: "4",
                        name: "NITRO_NOVA",
                        club: "SPEED DEMONS",
                        hp: "756 HP",
                        verified: true,
                      },
                      {
                        rank: "5",
                        name: "APEX_PREDATOR",
                        club: "STREET KINGS",
                        hp: "742 HP",
                        verified: true,
                      },
                    ].map((racer, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-red-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold w-6">
                            {racer.rank}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {racer.name}
                              </span>
                              {racer.verified && (
                                <Shield className="w-3 h-3 text-green-400" />
                              )}
                            </div>
                            <span className="text-red-500 text-sm">
                              {racer.club}
                            </span>
                          </div>
                        </div>
                        <span className="text-white font-bold">{racer.hp}</span>
                      </div>
                    ))}

                    <div className="text-center pt-2">
                      <span className="text-white/40 text-xs">
                        Updates every 30 seconds • 247 members tracked
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Challenge System */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-red-950/10">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 mb-4">
              CHALLENGE ACCEPTED
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Call Out Your <span className="text-red-500">Rivals</span>
            </h2>
            <p className="text-white/70 text-xl max-w-3xl mx-auto">
              Pre-built tournaments or create custom challenges. Put your
              reputation on the line. Winner takes all—including street cred
              that transfers to the real world.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Zap,
                title: "DYNO WARS",
                description: "Highest verified horsepower wins",
                prize: "$2,500 Cash Prize",
                status: "LIVE • 47 ENTRIES",
                color: "from-yellow-500/20 to-red-500/20",
              },
              {
                icon: Timer,
                title: "MIDNIGHT SPRINT",
                description: "Quarter-mile time attack challenge",
                prize: "$1,800 Winner Takes All",
                status: "STARTS IN 6H",
                color: "from-blue-500/20 to-red-500/20",
              },
              {
                icon: Car,
                title: "BUILD BATTLE",
                description: "Most creative engine bay wins",
                prize: "$1,200 + Sponsorship",
                status: "VOTING PHASE",
                color: "from-purple-500/20 to-red-500/20",
              },
              {
                icon: Crown,
                title: "CLUB WARFARE",
                description: "5v5 crew domination tournament",
                prize: "$5,000 Split + Territory",
                status: "ELIMINATION ROUND",
                color: "from-red-500/20 to-orange-500/20",
              },
              {
                icon: Target,
                title: "PRECISION DRIFT",
                description: "Skill-based drift competition",
                prize: "$900 + Pro Contract",
                status: "OPEN REGISTRATION",
                color: "from-indigo-500/20 to-red-500/20",
              },
              {
                icon: Gamepad2,
                title: "SIM SHOWDOWN",
                description: "Virtual track mastery contest",
                prize: "$600 + Gaming Rig",
                status: "QUALIFYING ROUNDS",
                color: "from-green-500/20 to-red-500/20",
              },
            ].map((challenge, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card
                  className={`bg-gradient-to-br ${challenge.color} border-red-500/30 hover:border-red-500/60 transition-all duration-300 group backdrop-blur-sm h-full overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/60" />
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 transition-colors border border-red-500/40">
                        <challenge.icon className="w-6 h-6 text-red-400" />
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs font-bold">
                        {challenge.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-white font-bold text-lg">
                      {challenge.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-white/80 mb-4">
                      {challenge.description}
                    </CardDescription>
                    <div className="text-center">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/40 font-bold">
                        {challenge.prize}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="text-center" {...fadeInUp}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white text-lg px-8"
              >
                <Link href="/challenges">View All Challenges</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-red-500/30 text-red-500 hover:bg-red-500 hover:border-red-500 hover:text-white text-lg px-8"
              >
                <Link href="/challenges/create">Create Custom Challenge</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3D Showcase Section */}
      <section className="py-24 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <div className="relative">
                <div className="absolute -inset-4 bg-red-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-black/50 rounded-xl overflow-hidden border border-red-500/30">
                  <CarModelViewer
                    glbUrl="/demo/r34.glb"
                    className="w-full h-96"
                    color="#ff0000"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="space-y-6"
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              <div>
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 mb-4">
                  DIGITAL TWIN TECHNOLOGY
                </Badge>
                <h3 className="text-4xl md:text-5xl font-bold mb-4">
                  Your Ride <span className="text-red-500">Immortalized</span>
                </h3>
                <p className="text-white/70 text-xl mb-6">
                  Professional 3D scanning creates a digital twin of your build.
                  Show it off, sell it with confidence, or flex on rivals with
                  photorealistic detail.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  "LiDAR precision scanning technology",
                  "Interactive 360° showcase viewer",
                  "Mod documentation and build history",
                  "Verified authenticity for marketplace",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Link href="/scan" className="inline-flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Book Your Scan
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marketplace Integration */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-red-950/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-6"
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              <div>
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 mb-4">
                  UNDERGROUND MARKETPLACE
                </Badge>
                <h3 className="text-4xl md:text-5xl font-bold mb-4">
                  Parts That <span className="text-red-500">Perform</span>
                </h3>
                <p className="text-white/70 text-xl mb-6">
                  Street-tested parts from verified sellers. Crypto payments
                  accepted. Every transaction backed by our reputation system
                  and community trust.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: Shield,
                    text: "Reputation-based seller verification",
                  },
                  { icon: CreditCard, text: "USD & USDC crypto payments" },
                  { icon: Camera, text: "3D verified authenticity checks" },
                  { icon: Users, text: "Club member exclusive deals" },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-white/80">{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  asChild
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Link href="/marketplace">Browse Parts</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-red-500/30 text-red-500 hover:bg-red-500 hover:border-red-500 hover:text-white"
                >
                  <Link href="/sell">List Your Part</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div {...fadeInUp}>
              <div className="relative">
                <div className="absolute -inset-4 bg-red-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-black/80 rounded-xl p-6 border border-red-500/30 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 font-bold">
                        HOT LISTINGS
                      </span>
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                        VERIFIED SELLERS
                      </Badge>
                    </div>

                    {[
                      {
                        part: "Garrett GT2860RS",
                        seller: "TURBO_KING",
                        club: "BOOST LORDS",
                        price: "$2,450",
                        rep: "⭐⭐⭐⭐⭐",
                      },
                      {
                        part: "Tomei Expreme Titanium",
                        seller: "EXHAUST_EXPERT",
                        club: "SOUND SQUAD",
                        price: "$1,850",
                        rep: "⭐⭐⭐⭐⭐",
                      },
                      {
                        part: "Spoon Sports Calipers",
                        seller: "JDM_PURIST",
                        club: "HONDA MAFIA",
                        price: "$3,200",
                        rep: "⭐⭐⭐⭐⭐",
                      },
                    ].map((listing, index) => (
                      <div
                        key={index}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white">
                            {listing.part}
                          </h4>
                          <span className="text-red-500 font-bold">
                            {listing.price}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-white/70">
                              {listing.seller}
                            </span>
                            <span className="text-red-400 ml-2">
                              • {listing.club}
                            </span>
                          </div>
                          <span className="text-yellow-400">{listing.rep}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Event Callout Banner */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-fixed"
            style={{ backgroundImage: "url('/landing/event-bg.jpg')" }}
          />
          {/* TODO: Add parallax image of underground parking garage meet with neon lights */}
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 via-transparent to-red-900/30" />
        </div>

        <motion.div className="relative z-10 text-center px-4" {...fadeInUp}>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/40 mb-4 text-lg px-6 py-2">
            🚨 NEXT TERRITORY WAR
          </Badge>
          <h3 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-red-500">MIDNIGHT RUNNERS</span> VS{" "}
            <span className="text-blue-400">TURBO MAFIA</span>
          </h3>
          <p className="text-white/80 mb-8 text-xl">
            Downtown Showdown • Industrial District
          </p>

          <CountdownTimer targetDate="2024-07-18T23:00:00" />

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              asChild
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white text-lg px-8"
            >
              <Link href="/events/territory-war">Join the War</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8"
            >
              <Link href="/spectate">Spectate Live</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-red-500/30 bg-black py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandIcon className="w-8 h-8 text-red-500" />
                <span className="text-2xl font-bold text-white">
                  REDLINE
                </span>
              </div>
              <p className="text-white/50 text-sm">
                The underground revolution where automotive culture meets
                enterprise technology. Build your legend, dominate your
                territory, rule the night.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-red-500">YOUR EMPIRE</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link
                    href="/clubs/create"
                    className="hover:text-red-500 transition-colors"
                  >
                    Create Club
                  </Link>
                </li>
                <li>
                  <Link
                    href="/leaderboards"
                    className="hover:text-red-500 transition-colors"
                  >
                    Rankings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/challenges"
                    className="hover:text-red-500 transition-colors"
                  >
                    Challenges
                  </Link>
                </li>
                <li>
                  <Link
                    href="/territory"
                    className="hover:text-red-500 transition-colors"
                  >
                    Territory Map
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-red-500">THE UNDERGROUND</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link
                    href="/marketplace"
                    className="hover:text-red-500 transition-colors"
                  >
                    Parts Market
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="hover:text-red-500 transition-colors"
                  >
                    Street Meets
                  </Link>
                </li>
                <li>
                  <Link
                    href="/builds"
                    className="hover:text-red-500 transition-colors"
                  >
                    Build Gallery
                  </Link>
                </li>
                <li>
                  <Link
                    href="/reputation"
                    className="hover:text-red-500 transition-colors"
                  >
                    Rep System
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-red-500">INTEL</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link
                    href="/rules"
                    className="hover:text-red-500 transition-colors"
                  >
                    Street Code
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-red-500 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-red-500 transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-red-500 transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-red-500/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/40 text-sm">
              © 2024 REDLINE PLATFORM. Own the night.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                🔴 LIVE: 2,847 MEMBERS ONLINE
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
