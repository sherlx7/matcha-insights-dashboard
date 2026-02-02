import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Leaf } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    // Check if already logged in via token
    const token = localStorage.getItem('matcha_auth_token');
    if (token) {
      navigate("/");
    }
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('matcha_auth_token', data.token);
      localStorage.setItem('matcha_user', JSON.stringify(data.user));
      
      // Redirect to dashboard
      navigate("/");
    } catch (err) {
      setError("Connection error. Please try again.");
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password,
          name: fullName.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Email already registered") {
          setError("This email is already registered. Please sign in instead.");
        } else if (data.details) {
          setError(data.details[0]?.message || data.error);
        } else {
          setError(data.error || "Registration failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('matcha_auth_token', data.token);
      localStorage.setItem('matcha_user', JSON.stringify(data.user));
      
      setSuccess("Account created successfully! Redirecting to dashboard...");
      
      // Redirect to dashboard
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setError("Connection error. Please try again.");
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
            <p className="text-[#5a6b5a] text-sm">
              {activeTab === "signin"
                ? "Sign in to access your B2B dashboard"
                : "Create your account to get started"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-[#e8e6e3] rounded-xl mb-8">
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
                    ? "bg-white text-[#1a2f1a] shadow-sm"
                    : "text-[#5a6b5a] hover:text-[#2d4a2d]"
                )}
              >
                {tab === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Sign In Form */}
          {activeTab === "signin" && (
            <form onSubmit={handleEmailSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={cn(
                    "text-sm transition-colors duration-200",
                    focusedField === "email" ? "text-[#2d4a2d]" : "text-[#5a6b5a]"
                  )}
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 bg-white border-[#d4d2cf] focus:border-[#2d4a2d] focus:ring-[#2d4a2d]/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className={cn(
                    "text-sm transition-colors duration-200",
                    focusedField === "password" ? "text-[#2d4a2d]" : "text-[#5a6b5a]"
                  )}
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 bg-white border-[#d4d2cf] focus:border-[#2d4a2d] focus:ring-[#2d4a2d]/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#2d4a2d] hover:bg-[#1a2f1a] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#2d4a2d]/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <form onSubmit={handleEmailSignUp} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className={cn(
                    "text-sm transition-colors duration-200",
                    focusedField === "fullName" ? "text-[#2d4a2d]" : "text-[#5a6b5a]"
                  )}
                >
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 bg-white border-[#d4d2cf] focus:border-[#2d4a2d] focus:ring-[#2d4a2d]/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="signupEmail"
                  className={cn(
                    "text-sm transition-colors duration-200",
                    focusedField === "signupEmail" ? "text-[#2d4a2d]" : "text-[#5a6b5a]"
                  )}
                >
                  Email Address
                </Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("signupEmail")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 bg-white border-[#d4d2cf] focus:border-[#2d4a2d] focus:ring-[#2d4a2d]/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="signupPassword"
                  className={cn(
                    "text-sm transition-colors duration-200",
                    focusedField === "signupPassword" ? "text-[#2d4a2d]" : "text-[#5a6b5a]"
                  )}
                >
                  Password
                </Label>
                <Input
                  id="signupPassword"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("signupPassword")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 bg-white border-[#d4d2cf] focus:border-[#2d4a2d] focus:ring-[#2d4a2d]/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#2d4a2d] hover:bg-[#1a2f1a] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#2d4a2d]/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-[#8a9b8a]">
            Trouble signing in? Contact{" "}
            <a href="mailto:support@matsumatcha.com" className="text-[#2d4a2d] hover:underline">
              support@matsumatcha.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
