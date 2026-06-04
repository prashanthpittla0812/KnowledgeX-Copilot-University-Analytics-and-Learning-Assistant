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
      toast.success("Account created successfully! Please sign in.");
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
          className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-purple-500/20 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            y: [0, 50, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-cyan-500/10 blur-[80px]"
        />
      </div>

      {/* Centered Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md my-12"
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
            Join Thousands of Students
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Create Account</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">Start your AI-powered academic journey</p>
        </div>

        <div className="rounded-[2rem] border border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 p-6 sm:p-10 shadow-2xl shadow-black/5 backdrop-blur-xl">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Smith"
                className="h-12 bg-white/50 dark:bg-slate-950/50 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                className="h-12 bg-white/50 dark:bg-slate-950/50 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-white/50 dark:bg-slate-950/50 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Confirm</label>
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-white/50 dark:bg-slate-950/50 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 mt-4 group"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          {/* Info banner for Faculty/Admin restriction */}
          <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              Only student accounts can be self-registered. 
              <strong className="block mt-1 text-primary">Faculty and Admin accounts are created by administrators.</strong>
            </p>
          </div>

          <div className="mt-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/" className="font-bold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
