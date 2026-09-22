import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CheckIcon
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { RenderRazorpayPopup } from "@/components/molecules/RenderRazorpayPopup/RenderRazorpayPopup";
import { Button } from "@/components/ui/button";
import { useCreateOrder } from "@/hooks/apis/payments/useCreateOrder";
import { useAuth } from "@/hooks/context/useAuth";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

export const Payments = () => {
  const amount = 49;
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [orderResponse, setOrderResponse] = useState(null);
  const { createOrderMutation, isPending } = useCreateOrder();

  const isPaidPlan = auth?.user?.plan === "Paid";

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      const response = await createOrderMutation('premium');
      setOrderResponse(response);
    } catch (error) {
      toast.error("Unable to start payment", {
        description: getApiErrorMessage(error, "Please try again."),
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10 relative overflow-hidden text-slate-200">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-purple-600/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-blue-600/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 relative z-10">

        {/* NORMAL PLAN */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">Normal Plan</h2>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-center gap-2">
                <CheckIcon size={18}/> 1 Workspace
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon size={18}/> 2 Channels per workspace
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon size={18}/> Basic setup
              </li>
            </ul>
          </div>

          <Button
            className="mt-8 w-full rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/5 cursor-pointer transition-all duration-300"
            onClick={() => navigate("/home")}
          >
            {isPaidPlan ? "Downgrade (Current Premium)" : "Continue With Current Plan"}
          </Button>
        </div>

        {/* PREMIUM PLAN */}
        <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl flex flex-col justify-between border relative overflow-hidden ${
          isPaidPlan ? "border-green-500/50" : "border-purple-500/30"
        }`}>
          {/* Subtle gradient overlay for Premium card */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Premium Plan
              </h2>

              {isPaidPlan && (
                <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                  <BadgeCheckIcon size={18}/> Current Plan
                </span>
              )}
            </div>

            <ul className="space-y-3 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckIcon size={18} className="text-purple-400" /> Unlimited Workspace
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon size={18} className="text-purple-400" /> Unlimited Channels
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon size={18} className="text-purple-400" /> AI Message Reply
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon size={18} className="text-purple-400" /> AI Meeting Summary
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon size={18} className="text-purple-400" /> Priority Support
              </li>
            </ul>

            <div className="mt-6 bg-black/20 rounded-xl p-6 text-center border border-white/5">
              <p className="text-sm text-slate-400">Price</p>
              <p className="text-4xl font-bold text-white">₹ {amount}</p>
              <p className="text-sm text-slate-400">One-time payment</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="mt-6 relative z-10">
            <Button
              type="submit"
              disabled={isPending || isPaidPlan}
              className="h-12 w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-lg cursor-pointer shadow-lg shadow-purple-500/20 transition-all duration-300 border border-white/10"
            >
              {isPaidPlan ? "You Already Own Premium" : "Upgrade to Premium"}
              {!isPaidPlan && <ArrowRightIcon className="ml-2 size-4" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Razorpay — amount/currency come from the server-created order, never
          from client state, so the checkout widget always reflects what will
          actually be charged. */}
      {orderResponse?.id ? (
        <RenderRazorpayPopup
          amount={orderResponse.amount}
          orderId={orderResponse.id}
          keyId={import.meta.env.VITE_RAZORPAY_KEY_ID}
          currency={orderResponse.currency}
        />
      ) : null}
    </div>
  );
};