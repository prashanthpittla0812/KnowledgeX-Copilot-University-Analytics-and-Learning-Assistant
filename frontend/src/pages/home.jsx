import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authApi } from "../api";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot, Mail, Lock, Eye, EyeOff, Brain, BookOpen, LineChart } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import toast from "react-hot-toast";

export default function Home() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");

  const motivityLogoPath = "/motivity.webp";
  const illustrationPath = "/student_ai_illustration.png";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");
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
        error?.response?.status === 401 || error?.response?.status === 403
          ? "Invalid password or email"
          : (error?.response?.data?.detail || "Invalid password or email");
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#fdfaf6] overflow-hidden">

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-orange-400/10 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[30%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-amber-400/10 blur-[80px]" />
      </div>

      {/* Left Pane - Hero Content */}
      <div className="w-full lg:w-1/2 p-4 sm:px-8 sm:pt-2 sm:pb-6 lg:px-16 lg:pt-0 xl:px-24 xl:pt-0 lg:pb-16 flex flex-col relative z-10 min-h-[50vh] lg:min-h-screen">

        {/* Motivity Logo */}
        <div className="flex items-center gap-2 mb-4 lg:mb-6 mt-2 lg:mt-6">
          <img src={motivityLogoPath} alt="Motivity Labs" className="h-7 sm:h-8 w-auto object-contain" />
        </div>

        {/* Badge & Title */}
        <div className="max-w-xl relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 font-bold text-xs mb-6 border border-orange-200">
            <Sparkles className="w-3.5 h-3.5" />
            KnowledgeX Copilot
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
            Your Academic <br />
            <span className="text-orange-500">AI</span> Companion
          </h1>

          <p className="text-slate-600 text-base sm:text-lg mb-10 max-w-sm">
            Ask questions, get insights, generate notes and accelerate your learning with AI.
          </p>

          {/* Feature List */}
          <div className="space-y-4 relative z-20">

            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="flex items-start gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white w-max pr-8 lg:pr-12"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Quiz Generator</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">Create custom quizzes instantly<br />to test your knowledge.</p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="flex items-start gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white w-max pr-8 lg:pr-12 ml-4 lg:ml-8"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">AI Assistance</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">24/7 intelligent support for<br />your academic queries.</p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="flex items-start gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white w-max pr-8 lg:pr-12"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create Study Plan</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">Generate personalized schedules<br />to maximize learning.</p>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="flex items-start gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white w-max pr-8 lg:pr-12 ml-4 lg:ml-8"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <LineChart className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Analyze Performance</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">Track your progress and get<br />insights to improve.</p>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Floating Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute right-[-8%] lg:right-[-3%] xl:right-[-8%] top-1/2 -translate-y-[45%] w-[350px] lg:w-[450px] pointer-events-none opacity-95 hidden md:block mix-blend-multiply z-0"
          style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, black 45%, transparent 70%)', maskImage: 'radial-gradient(ellipse at center, black 45%, transparent 70%)' }}
        >
          <img src={illustrationPath} alt="Student with AI" className="w-full h-auto object-contain drop-shadow-2xl" style={{ filter: 'contrast(1.05) brightness(1.02)' }} />
        </motion.div>



      </div>

      {/* Right Pane - Login Card */}
      <div className="w-full lg:w-1/2 p-4 sm:px-8 sm:py-6 lg:pt-4 xl:pt-6 flex items-start justify-center relative z-20 lg:min-h-screen">

        <div className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-2xl shadow-orange-900/5 p-8 sm:p-12 border border-slate-100/50">

          <div className="flex flex-col items-center text-center mb-10">
            {/* KnowledgeX 'K' Logo */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20 mb-6">
              K
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 font-semibold text-[10px] uppercase tracking-widest mb-4 border border-orange-100">
              <Sparkles className="w-3 h-3" />
              KnowledgeX Copilot
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back! 👋</h2>
            <p className="text-slate-500 text-sm mt-2">Sign in to continue your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="email"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setLoginError("");
                  }}
                  placeholder="student5@gmail.com"
                  className="pl-11 h-12 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-slate-900 font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError("");
                  }}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="pl-11 pr-11 h-12 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-slate-900 font-medium tracking-widest placeholder:tracking-normal placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {loginError && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">
                  {loginError}
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold shadow-lg shadow-orange-500/25 mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          {/* Create Account Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="text-sm font-medium text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                Create Student Account
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}