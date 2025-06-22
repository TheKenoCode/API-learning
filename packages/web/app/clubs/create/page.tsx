"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Crown, 
  MapPin, 
  Globe, 
  Lock, 
  Check,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateClubPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    city: "",
    isPrivate: false,
    category: ""
  });

  const createClubMutation = api.club.create.useMutation({
    onSuccess: (data: any) => {
      router.push(`/clubs/${data.id}`);
    },
    onError: (error: any) => {
      console.error("Failed to create club:", error);
    }
  });

  const handleSubmit = () => {
    createClubMutation.mutate({
      name: formData.name,
      description: formData.description,
      city: formData.city,
      isPrivate: formData.isPrivate
    });
  };

  const categories = [
    "Street Performance",
    "Track Days", 
    "Car Shows",
    "Drifting",
    "Drag Events",
    "Tuning",
    "Classic Cars",
    "Supercars",
    "JDM",
    "European",
    "American Muscle"
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Create Header - Positioned below the main mobile nav */}
      <div className="md:hidden sticky top-[4.5rem] z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold">Create Club</h1>
            <div className="text-sm text-white/60">Step {step} of 4</div>
          </div>
          
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <div 
            className="h-full bg-red-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block sticky top-20 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold">Create Club</h1>
            <div className="text-white/60">Step {step} of 4</div>
          </div>
          
          <div className="w-12" />
        </div>
        
                 {/* Progress Bar */}
         <div className="h-2 bg-white/10">
           <div 
             className="h-full bg-red-500 transition-all duration-500 ease-out"
             style={{ width: `${(step / 4) * 100}%` }}
           />
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-4xl mx-auto px-4 md:px-6 pb-24 md:pb-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="py-8 space-y-8 animate-in slide-in-from-right duration-300">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <Crown className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Let&apos;s start with the basics</h2>
                <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
                  Give your club a name and tell us what it&apos;s about
                </p>
              </div>
            </div>

            {/* Professional Form Card */}
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="p-6 md:p-8 space-y-8">
                {/* Club Name */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Club Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter your club name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 text-lg font-medium"
                      maxLength={50}
                    />
                    <div className="absolute top-4 right-6 text-white/40 text-sm font-medium">
                      {formData.name.length}/50
                    </div>
                  </div>
                  {formData.name && (
                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Perfect! This name looks great</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Club Description
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Tell us about your club's mission, goals, and what makes it special. This will help potential members understand what your club is all about."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={5}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 text-base resize-none leading-relaxed"
                      maxLength={500}
                    />
                    <div className="absolute bottom-4 right-6 text-white/40 text-sm font-medium">
                      {formData.description.length}/500
                    </div>
                  </div>
                  {formData.description && formData.description.length >= 50 && (
                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Great description! This will attract the right members</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Continue Button */}
            <div className="space-y-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name.trim() || !formData.description.trim()}
                className="w-full h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 disabled:shadow-none active:scale-[0.98] border border-red-400/20"
              >
                <div className="flex items-center space-x-3">
                  <span>Continue to Location</span>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Button>
              
              <p className="text-center text-white/40 text-sm">
                Step 1 of 4 • Your information is secure and private
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Location & Privacy */}
        {step === 2 && (
          <div className="py-8 space-y-8 animate-in slide-in-from-right duration-300">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Location & Privacy</h2>
                <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
                  Where is your club based and who can join?
                </p>
              </div>
            </div>

            {/* Professional Form Card */}
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="p-6 md:p-8 space-y-8">
                {/* Location */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Club Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      placeholder="City, State/Province, Country"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 text-lg font-medium"
                    />
                  </div>
                  {formData.city && (
                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Location set successfully</span>
                    </div>
                  )}
                </div>

                {/* Privacy Settings */}
                <div className="space-y-6">
                  <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Club Privacy
                  </label>
                  
                  <div className="grid gap-4">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                      className={`group p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                        !formData.isPrivate 
                          ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20" 
                          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center space-x-5">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          !formData.isPrivate 
                            ? "bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25" 
                            : "bg-white/10 group-hover:bg-white/20"
                        }`}>
                          <Globe className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl text-white mb-2">Public Club</div>
                          <div className="text-white/70 leading-relaxed">
                            Anyone can discover and join your club. Perfect for building a large community and attracting new members organically.
                          </div>
                        </div>
                        {!formData.isPrivate && (
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                      className={`group p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                        formData.isPrivate 
                          ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20" 
                          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center space-x-5">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          formData.isPrivate 
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/25" 
                            : "bg-white/10 group-hover:bg-white/20"
                        }`}>
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl text-white mb-2">Private Club</div>
                          <div className="text-white/70 leading-relaxed">
                            Invite-only membership with approval required. Ideal for exclusive groups and maintaining a curated community.
                          </div>
                        </div>
                        {formData.isPrivate && (
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Continue Button */}
            <div className="space-y-4">
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.city.trim()}
                className="w-full h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 disabled:shadow-none active:scale-[0.98] border border-red-400/20"
              >
                <div className="flex items-center space-x-3">
                  <span>Continue to Category</span>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Button>
              
              <p className="text-center text-white/40 text-sm">
                Step 2 of 4 • Privacy settings can be changed later
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Category */}
        {step === 3 && (
          <div className="py-8 space-y-8 animate-in slide-in-from-right duration-300">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <Crown className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Choose a Category</h2>
                <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
                  What type of automotive community is this?
                </p>
              </div>
            </div>

            {/* Professional Category Selection */}
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
                    Select Club Category
                  </label>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Choose the category that best represents your club&apos;s focus and activities. This helps members find your community.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setFormData(prev => ({ ...prev, category }))}
                      className={`group p-5 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] ${
                        formData.category === category 
                          ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20" 
                          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            formData.category === category 
                              ? "bg-red-500 shadow-lg shadow-red-500/25" 
                              : "bg-white/10 group-hover:bg-white/20"
                          }`}>
                            <Crown className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-lg text-white">{category}</div>
                            <div className="text-white/60 text-sm">
                              {category === "Street Performance" && "High-performance street builds"}
                              {category === "Track Days" && "Circuit racing and track events"}
                              {category === "Car Shows" && "Exhibitions and competitions"}
                              {category === "Drifting" && "Sideways sliding enthusiasts"}
                              {category === "Drag Events" && "Quarter-mile speed runs"}
                              {category === "Tuning" && "Engine and performance modifications"}
                              {category === "Classic Cars" && "Vintage and restored vehicles"}
                              {category === "Supercars" && "Exotic and luxury vehicles"}
                              {category === "JDM" && "Japanese domestic market"}
                              {category === "European" && "European marques and styling"}
                              {category === "American Muscle" && "V8 power and classics"}
                            </div>
                          </div>
                        </div>
                        {formData.category === category && (
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {formData.category && (
                  <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-green-400 font-semibold">Perfect choice!</div>
                        <div className="text-green-400/80 text-sm">
                          Your club will be discoverable by {formData.category.toLowerCase()} enthusiasts
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Continue Button */}
            <div className="space-y-4">
              <Button
                onClick={() => setStep(4)}
                disabled={!formData.category}
                className="w-full h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 disabled:shadow-none active:scale-[0.98] border border-red-400/20"
              >
                <div className="flex items-center space-x-3">
                  <span>Review & Create</span>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Button>
              
              <p className="text-center text-white/40 text-sm">
                Step 3 of 4 • Category helps members find your club
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Final Review */}
        {step === 4 && (
          <div className="py-8 space-y-8 animate-in slide-in-from-right duration-300">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Almost Done!</h2>
                <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
                  Review your club details and create it
                </p>
              </div>
            </div>

            {/* Professional Club Preview Card */}
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 backdrop-blur-xl">
              {/* Card Header */}
              <div className="p-6 md:p-8 border-b border-white/5">
                <div className="flex items-start space-x-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                      {formData.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold ${
                        !formData.isPrivate 
                          ? "bg-green-500/15 text-green-400 border border-green-500/20" 
                          : "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}>
                        {!formData.isPrivate ? (
                          <>
                            <Globe className="w-4 h-4 mr-2" />
                            Public Club
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Private Club
                          </>
                        )}
                      </div>
                      <div className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        <Crown className="w-4 h-4 mr-2" />
                        {formData.category}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
                    Club Description
                  </h4>
                  <p className="text-white/90 text-lg leading-relaxed">
                    {formData.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/60">Location</div>
                      <div className="text-white font-semibold">{formData.city}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-white/60">Members</div>
                    <div className="text-white font-semibold">1 (You)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise Create Button */}
            <div className="space-y-4">
              <Button
                onClick={handleSubmit}
                disabled={createClubMutation.isLoading}
                className="w-full h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 disabled:shadow-none active:scale-[0.98] border border-red-400/20"
              >
                {createClubMutation.isLoading ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Your Club...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Crown className="w-6 h-6" />
                    <span>Create Your Club</span>
                  </div>
                )}
              </Button>
              
              <p className="text-center text-white/40 text-sm">
                By creating a club, you agree to our community guidelines
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 