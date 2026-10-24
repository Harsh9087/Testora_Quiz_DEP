"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Copy, Check, Download, QrCode } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export default function QRCodeModal({ isOpen, onClose, title, url }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && url) {
      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: "#242321",
          light: "#FFFFFF"
        }
      })
        .then((dataUrl: string) => setQrDataUrl(dataUrl))
        .catch((err: any) => console.error("Error generating QR code:", err));
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-5 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] dark:border-[#292524]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C84B18]/10 text-[#C84B18] dark:text-[#EA580C]">
              <QrCode className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4] truncate max-w-[200px]">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#716D67] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* QR Display */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#FAF8F5] dark:bg-[#0F0E0D] rounded-xl border border-[#E5E0D8] dark:border-[#292524]">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Form QR Code" 
              className="w-56 h-56 rounded-lg bg-white p-2 shadow-2xs" 
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#C84B18] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] mt-3 text-center">
            Students can scan this QR code with their mobile phone camera to open and submit the form instantly.
          </p>
        </div>

        {/* Shareable Link Box */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-[#716D67] dark:text-[#A8A29E]">Shareable URL</div>
          <div className="flex items-center gap-2 bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] dark:border-[#292524] rounded-xl px-3 py-2 text-xs">
            <span className="truncate text-[#242321] dark:text-[#F5F5F4] font-mono text-[11px] select-all flex-1">
              {url}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] text-[#716D67] hover:text-[#C84B18] transition-colors cursor-pointer shrink-0"
              title="Copy Link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex-1 py-2 px-3 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download QR PNG</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 py-2 px-3 rounded-xl bg-[#C84B18] hover:bg-[#B33F10] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Link Copied!" : "Copy Link"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
