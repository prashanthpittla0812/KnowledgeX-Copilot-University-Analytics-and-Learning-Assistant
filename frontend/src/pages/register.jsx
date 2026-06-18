import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot, Mail, Lock, Eye, EyeOff, Brain, BookOpen, LineChart, Info, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const motivityLogoPath = "/motivity.webp";
  const illustrationPath = "/student_ai_illustration.png";

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

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
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

      if (email.trim().toLowerCase().endsWith("@ifheindia.org")) {
        window.alert("Account created successfully!\n\nYour account has been automatically approved. You can now log in.");
      } else {
        window.alert(
          "Account created successfully!\n\nYour account is currently in a PENDING state. An administrator must approve your registration before you can log in."
        );
      }

      navigate("/");
    } catch (error) {
      let message = "Failed to create account. Please try again.";
      if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail[0].msg;
        } else if (typeof error.response.data.detail === "string") {
          message = error.response.data.detail;
        }
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
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

      {/* Right Pane - Register Card */}
      <div className="w-full lg:w-1/2 p-4 sm:px-8 sm:py-6 lg:pt-4 xl:pt-6 flex items-start justify-center relative z-20 lg:min-h-screen">

        <div className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-2xl shadow-orange-900/5 p-8 sm:p-12 border border-slate-100/50">

          <div className="flex flex-col items-center text-center mb-8">
            {/* KnowledgeX 'K' Logo */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20 mb-6">
              K
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 font-semibold text-[10px] uppercase tracking-widest mb-4 border border-orange-100">
              <Sparkles className="w-3 h-3" />
              Join the Platform
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
            <p className="text-slate-500 text-sm mt-2">Start your AI-powered academic journey</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Smith"
                  className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-slate-900 font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-slate-900 font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-slate-900 font-medium tracking-widest placeholder:tracking-normal placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-slate-900 font-medium tracking-widest placeholder:tracking-normal placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold shadow-lg shadow-orange-500/25 mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          {/* Info banner for Faculty/Admin restriction */}
          <div className="mt-6 p-4 rounded-xl bg-orange-50/50 border border-orange-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Only student accounts can be self-registered.
              <strong className="block mt-1 text-orange-600">Faculty account is created by the admin.</strong>
            </p>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <div className="text-sm font-medium text-slate-500">
              Already have an account?{" "}
              <Link to="/" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                Sign In
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}