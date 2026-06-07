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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden p-4">
      {/* Absolute Header with Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-purple-500/20 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            y: [0, -50, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[40%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-cyan-500/10 blur-[80px]"
        />
      </div>

      {/* Centered Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="mx-auto flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 items-center justify-center text-white font-black text-3xl shadow-2xl shadow-indigo-500/30 mb-6"
          >
            K
          </motion.div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs mb-4 border border-primary/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> 
            KnowledgeX Copilot
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">Sign in to your account to continue</p>
        </div>

        <div className="rounded-[2rem] border border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 p-6 sm:p-10 shadow-2xl shadow-black/5 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="user@university.edu"
                className="h-12 bg-white/50 dark:bg-slate-950/50 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
                <button type="button" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Forgot password?</button>
              </div>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="h-12 bg-white/50 dark:bg-slate-950/50 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 mt-2 group"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
                Create Student Account
              </Link>
            </div>
            
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
              Faculty and Admin users can sign in using credentials provided by the institution.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
