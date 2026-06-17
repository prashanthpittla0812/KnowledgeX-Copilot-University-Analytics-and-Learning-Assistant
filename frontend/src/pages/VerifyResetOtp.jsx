import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { KeyRound, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import toast from "react-hot-toast";

export default function VerifyResetOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.verifyResetOtp({ email, otp_code: otp });
      toast.success("OTP Verified! Please enter your new password.");
      navigate("/reset-password", { state: { email, otp_code: otp } });
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    try {
      await authApi.forgotPassword({ email });
      toast.success("A new OTP has been sent.");
      setTimeLeft(60);
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6] p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100/50 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white mx-auto mb-6">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Verify OTP</h2>
        <p className="text-slate-500 text-sm mb-8">We've sent a password reset code to <br/><span className="font-bold text-slate-700">{email}</span></p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em] h-14 bg-slate-50 border-slate-200 rounded-xl font-bold"
          />
          <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" disabled={isLoading || otp.length !== 6}>
            {isLoading ? "Verifying..." : "Verify OTP"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="mt-8 text-sm text-slate-500">
          Didn't receive the code?{" "}
          {timeLeft > 0 ? (
            <span className="text-orange-500 font-medium">Wait {timeLeft}s</span>
          ) : (
            <button onClick={handleResend} className="font-bold text-orange-500 hover:text-orange-600 underline">
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
