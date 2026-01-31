import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Leaf } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setIsLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Please verify your email before signing in.");
      } else {
        setError(error.message);
      }
    }
    setIsLoading(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!fullName.trim()) {
        throw new Error("Please enter your full name");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      }
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(error.message);
      }
    } else {
      setSuccess("Account created successfully! You can now sign in.");
      setEmail("");
      setPassword("");
      setFullName("");
      setTimeout(() => setActiveTab("signin"), 2000);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand Experience */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Layered Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2f1a] via-[#2d4a2d] to-[#1a3a1a]" />

        {/* Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Animated Steam Effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-[0.08] animate-steam"
              style={{
                left: `${20 + i * 15}%`,
                bottom: '30%',
                width: '60px',
                height: '200px',
                background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.4), transparent)',
                borderRadius: '50%',
                filter: 'blur(20px)',
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#3d5a3d]/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#4a6b4a]/15 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo & Branding */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10">
              <img
                src="/MatsuMatcha.jpeg"
                alt="Matsu Matcha"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-[0.2em] text-white/90" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                MATSU MATCHA
              </h1>
              <p className="text-xs tracking-[0.3em] text-white/50 uppercase mt-1">
                Premium B2B Portal
              </p>
            </div>
          </div>

          {/* Central Message */}
          <div className="max-w-md">
            <div className="mb-8">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                <span className="text-xs tracking-[0.2em] text-white/60 uppercase">
                  Sourced from Uji, Kyoto
                </span>
              </div>
              <h2
                className="text-5xl font-light text-white/95 leading-[1.15] mb-6"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Where tradition<br />
                meets <span className="italic text-[#8fb88f]">excellence</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed font-light">
                Access your dashboard to manage orders, track inventory, and discover insights
                powered by our AI recommendation engine.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-12">
              {[
                { value: "12+", label: "Supplier Partners" },
                { value: "98%", label: "Quality Score" },
                { value: "24h", label: "Order Processing" },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div
                    className="text-3xl font-light text-[#8fb88f] mb-1 transition-transform group-hover:translate-y-[-2px]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs tracking-[0.15em] text-white/40 uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">
              &copy; 2024 Matsu Matcha Pte Ltd. Singapore.
            </p>
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-[#6b8f6b]" />
              <span className="text-xs text-white/40">Sustainably Sourced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-[#faf9f7]">
        {/* Subtle Paper Texture */}
        <div
          className="absolute inset-0 lg:left-[55%] opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg">
              <img
                src="/MatsuMatcha.jpeg"
                alt="Matsu Matcha"
                className="w-full h-full object-cover"
              />
            </div>
            <h1
              className="text-xl tracking-[0.15em] text-[#2d4a2d]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              MATSU MATCHA
            </h1>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2
              className="text-3xl text-[#1a2f1a] mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {activeTab === "signin" ? "Welcome back" : "Join us"}
            </h2>
            <p className="text-[#6b7c6b] text-sm">
              {activeTab === "signin"
                ? "Sign in to access your B2B dashboard"
                : "Create an account to get started"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex mb-8 p-1 bg-[#e8e6e1] rounded-xl">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError(null);
                  setSuccess(null);
                }}
                className={cn(
                  "flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300",
                  activeTab === tab
                    ? "bg-white text-[#2d4a2d] shadow-sm"
                    : "text-[#6b7c6b] hover:text-[#4a5f4a]"
                )}
              >
                {tab === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6 border-[#8fb88f]/30 bg-[#8fb88f]/10">
              <CheckCircle className="h-4 w-4 text-[#4a6b4a]" />
              <AlertDescription className="text-[#4a6b4a]">{success}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={activeTab === "signin" ? handleEmailSignIn : handleEmailSignUp} className="space-y-5">
            {activeTab === "signup" && (
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    focusedField === "fullName" ? "text-[#4a6b4a]" : "text-[#4a5a4a]"
                  )}
                >
                  Full Name
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField("fullName")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "h-12 bg-white border-[#d4d1c9] rounded-xl px-4 text-[#1a2f1a] placeholder:text-[#a0a89a]",
                      "transition-all duration-300",
                      "focus:border-[#8fb88f] focus:ring-2 focus:ring-[#8fb88f]/20",
                      "hover:border-[#b0baa8]"
                    )}
                    required
                  />
                  <div
                    className={cn(
                      "absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#8fb88f] to-[#6b8f6b] rounded-full",
                      "transition-transform duration-300 origin-left",
                      focusedField === "fullName" ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  focusedField === "email" ? "text-[#4a6b4a]" : "text-[#4a5a4a]"
                )}
              >
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "h-12 bg-white border-[#d4d1c9] rounded-xl px-4 text-[#1a2f1a] placeholder:text-[#a0a89a]",
                    "transition-all duration-300",
                    "focus:border-[#8fb88f] focus:ring-2 focus:ring-[#8fb88f]/20",
                    "hover:border-[#b0baa8]"
                  )}
                  required
                />
                <div
                  className={cn(
                    "absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#8fb88f] to-[#6b8f6b] rounded-full",
                    "transition-transform duration-300 origin-left",
                    focusedField === "email" ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  focusedField === "password" ? "text-[#4a6b4a]" : "text-[#4a5a4a]"
                )}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "h-12 bg-white border-[#d4d1c9] rounded-xl px-4 text-[#1a2f1a] placeholder:text-[#a0a89a]",
                    "transition-all duration-300",
                    "focus:border-[#8fb88f] focus:ring-2 focus:ring-[#8fb88f]/20",
                    "hover:border-[#b0baa8]"
                  )}
                  required
                />
                <div
                  className={cn(
                    "absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#8fb88f] to-[#6b8f6b] rounded-full",
                    "transition-transform duration-300 origin-left",
                    focusedField === "password" ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-12 mt-6 rounded-xl text-sm font-medium tracking-wide",
                "bg-gradient-to-r from-[#3d5a3d] to-[#4a6b4a]",
                "hover:from-[#4a6b4a] hover:to-[#5a7b5a]",
                "text-white shadow-lg shadow-[#3d5a3d]/20",
                "transition-all duration-300",
                "hover:shadow-xl hover:shadow-[#3d5a3d]/30 hover:-translate-y-0.5",
                "active:translate-y-0"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                activeTab === "signin" ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {/* Footer Note */}
          {activeTab === "signup" && (
            <p className="mt-6 text-xs text-center text-[#8b9a8b]">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          )}

          {activeTab === "signin" && (
            <p className="mt-6 text-xs text-center text-[#8b9a8b]">
              Trouble signing in? Contact{" "}
              <a href="mailto:support@matsumatcha.com" className="text-[#4a6b4a] hover:underline">
                support@matsumatcha.com
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Global Styles for Animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&display=swap');

        @keyframes steam {
          0% {
            transform: translateY(0) scaleX(1);
            opacity: 0;
          }
          15% {
            opacity: 0.08;
          }
          50% {
            transform: translateY(-80px) scaleX(1.5);
            opacity: 0.05;
          }
          100% {
            transform: translateY(-160px) scaleX(2);
            opacity: 0;
          }
        }

        .animate-steam {
          animation: steam 4s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
