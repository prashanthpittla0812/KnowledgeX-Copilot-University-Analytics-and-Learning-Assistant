import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      toast.success("If your email is registered, an OTP has been sent.");
      navigate("/verify-reset-otp", { state: { email: email.trim() } });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6] p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100/50 text-center relative">
        <Link to="/" className="absolute left-6 top-6 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white mx-auto mb-6">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Forgot Password?</h2>
        <p className="text-slate-500 text-sm mb-8">Enter your registered email address and we'll send you an OTP to reset your password.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Registered Email"
              className="pl-11 h-12 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-slate-900 font-medium placeholder:text-slate-400"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" disabled={isLoading || !email}>
            {isLoading ? "Sending OTP..." : "Send Reset OTP"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}
