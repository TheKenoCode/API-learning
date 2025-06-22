import { SignUp } from "@clerk/nextjs";
import { Crown, ArrowLeft, Target, Users } from "lucide-react";
import Link from "next/link";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-900/20 via-black to-black" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(239,68,68,0.1),transparent_70%)]" />
      
      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
        <Link 
          href="/"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm sm:text-base">Back</span>
        </Link>
      </div>
      
      {/* Main Content Container - Improved responsive centering */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[440px] mx-auto">
          {/* Header - Adjusted spacing */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500/10 rounded-full border border-red-500/20 backdrop-blur-sm mb-4">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <span className="text-red-400 text-xs sm:text-sm font-medium">JOIN THE ELITE</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Join <span className="text-red-500">Redline</span>
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Create your account and enter the ultimate automotive community
            </p>
          </div>

          {/* Clerk Sign Up Component - Improved container */}
          <div className="w-full">
            <SignUp 
              appearance={{
                baseTheme: dark,
                elements: {
                  rootBox: "w-full",
                  card: "bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: 
                    "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 " +
                    "text-white transition-all duration-200 h-11 sm:h-12 text-sm sm:text-base " +
                    "font-medium rounded-lg",
                  socialButtonsBlockButtonText: "font-medium",
                  socialButtonsProviderIcon: "w-5 h-5",
                  formFieldLabel: "text-white/80 text-sm font-medium mb-2 block",
                  formFieldInput: 
                    "bg-white/5 border border-white/10 text-white placeholder:text-white/30 " +
                    "focus:bg-white/10 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 " +
                    "rounded-lg h-11 sm:h-12 px-4 text-sm sm:text-base transition-all duration-200 " +
                    "w-full",
                  formFieldInputShowPasswordButton: "text-white/40 hover:text-white/60",
                  formButtonPrimary: 
                    "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 " +
                    "text-white font-semibold h-11 sm:h-12 px-6 rounded-lg transition-all duration-200 " +
                    "shadow-lg shadow-red-500/25 hover:shadow-red-500/30 hover:scale-[1.02] " +
                    "text-sm sm:text-base w-full",
                  footerActionLink: "text-red-400 hover:text-red-300 font-medium transition-colors duration-200",
                  footer: "!bg-transparent mt-6",
                  identityPreviewText: "text-white/80",
                  identityPreviewEditButtonIcon: "text-red-400",
                  formFieldAction: "text-red-400 hover:text-red-300 text-sm",
                  formFieldError: "text-red-400 text-sm mt-1.5",
                  dividerLine: "bg-white/10",
                  dividerText: "text-white/40 text-sm font-normal bg-black px-4",
                  otpCodeFieldInput: 
                    "!bg-white/5 !border-white/10 !text-white text-center font-mono " +
                    "focus:!bg-white/10 focus:!border-red-500/50",
                  formFieldSuccessText: "text-green-400 text-sm",
                  phoneInputBox: "bg-white/5 border-white/10",
                  formResendCodeLink: "text-red-400 hover:text-red-300",
                  // Form spacing
                  form: "space-y-5",
                  formFieldRow: "space-y-2",
                  socialButtonsBlock: "space-y-3",
                  // Footer elements
                  footerAction: "text-center",
                  footerPages: "mt-4 text-center text-xs space-x-3",
                  footerPagesLink: "text-white/40 hover:text-white/60 transition-colors duration-200",
                  // Loading state
                  formButtonPrimarySpinner: "text-white",
                  // Error messages
                  formFieldErrorText: "text-red-400 text-sm mt-1.5",
                  // Back button in alternative views
                  backLink: "text-white/60 hover:text-white/80",
                  backLinkIcon: "text-white/60",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                  showOptionalFields: false,
                  termsPageUrl: "/terms",
                  privacyPageUrl: "/privacy",
                },
                variables: {
                  colorPrimary: "#ef4444",
                  colorText: "#ffffff",
                  colorTextSecondary: "rgba(255, 255, 255, 0.6)",
                  colorBackground: "rgba(0, 0, 0, 0.5)",
                  colorInputBackground: "rgba(255, 255, 255, 0.05)",
                  colorInputText: "#ffffff",
                  borderRadius: "0.75rem",
                  spacingUnit: "1rem",
                  fontSize: "16px",
                },
              }}
              signInUrl="/sign-in"
              redirectUrl="/dashboard"
            />
          </div>

          {/* Bottom CTA - Improved spacing */}
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-white/60 text-sm sm:text-base">
              Already have an account?{" "}
              <Link 
                href="/sign-in" 
                className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200 hover:underline underline-offset-4"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Benefits - Redesigned for better mobile experience */}
          <div className="mt-8 sm:mt-12">
            <div className="flex items-center justify-center gap-4 text-white/40 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Elite Clubs</span>
              </div>
              <div className="w-1 h-1 bg-white/20 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Challenges</span>
              </div>
              <div className="w-1 h-1 bg-white/20 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Community</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 