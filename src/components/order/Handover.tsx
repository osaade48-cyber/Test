import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Camera, KeyRound, ScanLine } from "lucide-react";
import type { Handover } from "@/types/models";
import { Button } from "@/components/ui/Button";
import { Modal, useToast } from "@/components/ui/overlay";
import { Notice } from "@/components/ui/primitives";
import { HANDOVER_WARNING } from "@/config/copy";
import { FEATURES, HANDOVER_CODE_LENGTH } from "@/config/business";
import { confirmHandover } from "@/services/orders";
import { formatMoney } from "@/lib/format";

/** Seller side: QR + 6-digit backup code. */
export function SellerHandoverCard({ handover }: { handover: Handover }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-line bg-surface p-5 text-center">
      <p className="text-h3 font-serif">Show this to the buyer</p>
      <p className="mt-1 max-w-xs text-caption text-muted">Let them inspect the item first. They scan this code to release your payment.</p>
      <div className="mt-4 rounded-lg bg-white p-4">
        <QRCodeSVG value={handover.qrPayload} size={200} level="M" aria-label="Handover QR code" />
      </div>
      <p className="mt-4 text-caption text-muted">Backup code</p>
      <p className="font-mono text-[2rem] font-semibold tracking-[0.3em]" aria-label={`Backup code ${handover.code.split("").join(" ")}`}>
        {handover.code}
      </p>
      <p className="mt-2 text-caption text-muted">Never share this code before the buyer has the item in front of them.</p>
    </div>
  );
}

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/** Camera QR scanner using the browser BarcodeDetector API where available. */
function QrScanner({ onResult, onUnavailable }: { onResult: (v: string) => void; onUnavailable: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!BD || !navigator.mediaDevices?.getUserMedia) {
      onUnavailable();
      return;
    }
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const detector = new BD({ formats: ["qr_code"] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (!video.current) return;
        video.current.srcObject = s;
        video.current.play();
        const tick = async () => {
          if (stopped || !video.current) return;
          try {
            const codes = await detector.detect(video.current);
            if (codes[0]?.rawValue) {
              onResult(codes[0].rawValue);
              return;
            }
          } catch {
            /* frame not ready */
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(onUnavailable);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
      <video ref={video} className="h-full w-full object-cover" muted playsInline aria-label="Camera preview" />
      <ScanLine className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 text-white/70" aria-hidden />
    </div>
  );
}

/** Buyer side: inspect → scan or type code → confirm. */
export function ReleasePaymentModal({
  open,
  onClose,
  orderId,
  amount,
  demoCode,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  demoCode?: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState<"check" | "scan" | "code">("check");
  const [code, setCode] = useState("");
  const [inspected, setInspected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setStep("check");
      setCode("");
      setInspected(false);
      setError(null);
    }
  }, [open]);

  const submit = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      await confirmHandover(orderId, value);
      toast("Payment released — enjoy!");
      onDone();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setStep("code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Release payment">
      {step === "check" && (
        <div className="space-y-4">
          <Notice tone="warn" icon={<AlertTriangle className="h-4 w-4" />} title="Only confirm once you've checked the item">
            {HANDOVER_WARNING}
          </Notice>
          <label className="flex min-h-tap cursor-pointer items-start gap-3 rounded-md border border-line p-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--c-ink))]" checked={inspected} onChange={(e) => setInspected(e.target.checked)} />
            <span>I've inspected the item and I'm happy with it. Release {formatMoney(amount)} to the seller.</span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button disabled={!inspected} icon={<Camera className="h-4 w-4" />} onClick={() => setStep("scan")}>
              Scan seller's QR
            </Button>
            <Button variant="secondary" disabled={!inspected} icon={<KeyRound className="h-4 w-4" />} onClick={() => setStep("code")}>
              Type 6-digit code
            </Button>
          </div>
        </div>
      )}
      {step === "scan" && (
        <div className="space-y-3">
          <QrScanner
            onResult={submit}
            onUnavailable={() => {
              toast("Camera scanning isn't available here — type the code instead", "error");
              setStep("code");
            }}
          />
          <Button variant="ghost" full onClick={() => setStep("code")}>Type the code instead</Button>
        </div>
      )}
      {step === "code" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(code);
          }}
        >
          <label htmlFor="hcode" className="label">Code on the seller's screen</label>
          <input
            id="hcode"
            className="input text-center font-mono text-h2 tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={HANDOVER_CODE_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          {error && <p className="text-caption text-danger" role="alert">{error}</p>}
          {FEATURES.demoShowHandoverCode && demoCode && <p className="text-caption text-muted">Demo: the seller's code is {demoCode}</p>}
          <Button type="submit" full disabled={code.length !== HANDOVER_CODE_LENGTH} loading={busy}>
            Confirm &amp; release {formatMoney(amount)}
          </Button>
        </form>
      )}
    </Modal>
  );
}
