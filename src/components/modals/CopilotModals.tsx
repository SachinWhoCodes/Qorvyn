import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, AlertTriangle, CreditCard, Sparkles } from "lucide-react";

export function CopilotModals() {
  const {
    showMicModal, setShowMicModal, setMicPermission, startListening,
    showDemoEndedModal, setShowDemoEndedModal,
    showLowCreditsModal, setShowLowCreditsModal,
    showOutOfCreditsModal, setShowOutOfCreditsModal,
    showOnboarding, setShowOnboarding,
  } = useApp();

  const navigate = useNavigate();

  async function requestMic() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      setShowMicModal(false);
      setTimeout(() => startListening(), 100);
    } catch {
      setMicPermission("denied");
      setShowMicModal(false);
    }
  }

  return (
    <>
      {/* Mic permission */}
      <Dialog open={showMicModal} onOpenChange={setShowMicModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Microphone Access</DialogTitle>
            <DialogDescription className="text-center">
              We need microphone permission to capture speech and generate live context.
              You can stop anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setMicPermission("denied");
                setShowMicModal(false);
              }}
            >
              Deny
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground" onClick={requestMic}>
              Allow Microphone
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo ended */}
      <Dialog open={showDemoEndedModal} onOpenChange={setShowDemoEndedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <DialogTitle className="text-center">Trial ended</DialogTitle>
            <DialogDescription className="text-center">
              Your 3-minute demo is over. Sign in to continue and get 100 free credits.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDemoEndedModal(false)}>
              Not now
            </Button>
            <Button className="flex-1" onClick={() => { setShowDemoEndedModal(false); navigate("/login"); }}>
              Sign in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Low credits */}
      <Dialog open={showLowCreditsModal} onOpenChange={setShowLowCreditsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Low credits</DialogTitle>
            <DialogDescription className="text-center">
              You’re running low. Recharge to avoid interruption.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowLowCreditsModal(false)}>
              Later
            </Button>
            <Button className="flex-1" onClick={() => { setShowLowCreditsModal(false); navigate("/wallet"); }}>
              Go to Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Out of credits */}
      <Dialog open={showOutOfCreditsModal} onOpenChange={setShowOutOfCreditsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <CreditCard className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Out of credits</DialogTitle>
            <DialogDescription className="text-center">
              Recharge your wallet to keep using the live copilot.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowOutOfCreditsModal(false)}>
              Close
            </Button>
            <Button className="flex-1" onClick={() => { setShowOutOfCreditsModal(false); navigate("/wallet"); }}>
              Recharge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Welcome!</DialogTitle>
            <DialogDescription className="text-center">
              You’ve received 100 free credits (100 minutes). Press Start to begin.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={() => setShowOnboarding(false)}>Let’s go</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

