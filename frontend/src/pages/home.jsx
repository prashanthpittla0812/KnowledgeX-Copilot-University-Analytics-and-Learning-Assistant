import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authApi } from "../api";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ThemeToggle } from "../components/ui/theme-toggle";
import toast from "react-hot-toast";

export default function Home() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Safely references your public directory asset
  const motivityLogoPath = "/motivity.webp";

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const loginResponse = await authApi.login({
        email: identifier.trim(),
        password,
      });
      const { user } = loginResponse;

      if (!user || !user.role) {
        toast.error("Logged in successfully, but could not retrieve your role.");
        return;
      }

      toast.success(`Welcome back, ${user.name}!`);

      if (user.must_change_password || loginResponse.must_change_password) {
        toast.error("You must change your password to continue.");
        navigate("/change-password");
        return;
      }

      // Route dynamically based on backend role
      if (user.role === "student") navigate("/student-dashboard");
      else if (user.role === "faculty") navigate("/faculty-dashboard");
      else if (user.role === "admin") navigate("/admin-dashboard");
      else navigate("/");

    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Invalid credentials. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden p-4 sm:p-6">
      
      {/* Absolute Positioned Header containing Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Dynamic Animated Mesh Gradient Backdrop Canvas Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, 45, 0],
            opacity: [0.3, 0.45, 0.3]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-15%] left-[-10%] w-[75vw] h-[75vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/15 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            opacity: [0.25, 0.35, 0.25]
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-10%] w-[65vw] h-[65vw] max-w-[650px] max-h-[650px] rounded-full bg-orange-500/15 blur-[110px]"
        />
      </div>

      {/* Main Interactive Presentation Module Wrapper */}
      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md flex flex-col items-center"
      >
        
        {/* BRAND IDENTITY STACK: Motivity Logo, Orange Icon & Badge */}
        <div className="w-full flex flex-col items-center mb-6 text-center">
          
          {/* 1. Motivity Labs Brand Asset Layer */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-5 flex justify-center max-w-[220px]"
          >
            <img 
              src={motivityLogoPath}
              alt="Motivity Labs" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </motion.div>

          {/* 2. Custom KnowledgeX Bold Block Icon 'K' */}
          <motion.div 
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.25 }}
            className="flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 items-center justify-center text-white font-black text-2xl shadow-xl shadow-orange-500/20 mb-4"
          >
            K
          </motion.div>

          {/* 3. Copilot Highlight Label Pill Block */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary dark:text-orange-400 font-bold text-xs mb-2 border border-primary/20 dark:border-orange-500/20 backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" /> 
            KnowledgeX Copilot
          </div>

          <h1 className="text-3xl font-black tracking-tight text-foreground mt-2">Welcome back</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Sign in to your account to continue</p>
        </div>

        {/* GLASSMORPHISM WORKSPACE CONTROL LAYER CARD */}
        <div className="w-full rounded-[2rem] border border-white/20 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-10 shadow-2xl shadow-black/5 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Form Field Context */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Email Address</label>
              <Input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="user@university.edu"
                className="h-12 bg-white/50 dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl"
              />
            </div>

            {/* Password Form Field Context */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Password</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="h-12 bg-white/50 dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl"
              />
            </div>

            {/* Form Validation Submission Dispatch Button */}
            <Button 
              type="submit" 
              variant="gradient" 
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 mt-4 group rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          {/* Registration Redirect Layout Block */}
          <div className="mt-6 text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                Create Student Account
              </Link>
            </div>
            
            <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium leading-relaxed max-w-xs mx-auto border-t border-gray-200/60 dark:border-slate-800/60 pt-3">
              Faculty and Admin users can sign in using credentials provided by the institution.
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}