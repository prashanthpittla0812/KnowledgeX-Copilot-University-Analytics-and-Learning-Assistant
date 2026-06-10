import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Info } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ThemeToggle } from "../components/ui/theme-toggle";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Safely references your public directory asset
  const motivityLogoPath = "/motivity.webp";

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: "student",
      });
      window.alert(
        "Account created successfully!\n\nYour account is currently in a PENDING state. An administrator must approve your registration before you can log in."
      );
      navigate("/");
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create account. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden p-4 sm:p-6">
      
      {/* Absolute Positioned Header with Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Dynamic Animated Mesh Gradient Backdrop Canvas Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-orange-500/20 blur-[100px]"
        />
      </div>

      {/* Main Interactive Presentation Module Wrapper */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md my-12 flex flex-col items-center"
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
            Join Thousands of Students
          </div>

          <h1 className="text-3xl font-black tracking-tight text-foreground mt-2">Create Account</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Start your AI-powered academic journey</p>
        </div>

        {/* GLASSMORPHISM WORKSPACE CONTROL LAYER CARD */}
        <div className="w-full rounded-[2rem] border border-white/20 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-10 shadow-2xl shadow-black/5 backdrop-blur-xl">
          <form onSubmit={handleRegister} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Smith"
                className="h-12 bg-white/50 dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                className="h-12 bg-white/50 dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Confirm</label>
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-white/50 dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 mt-4 group rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          {/* Info banner for Faculty/Admin restriction */}
          <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 dark:border-orange-500/10 flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed font-medium">
              Only student accounts can be self-registered.
              <strong className="block mt-1 text-orange-500">Faculty account is created by the admin.</strong>
            </p>
          </div>

          <div className="mt-8 text-center text-sm font-medium text-gray-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link to="/" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}