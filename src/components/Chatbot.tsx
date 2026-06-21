import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { MessageCircle, X, Send, Image as ImageIcon, Loader2, RefreshCw, UserCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  text: string;
  isBot: boolean;
  image?: string; // base64 data for thumbnail/bubble display
  isAction?: boolean; // special action banner like Escalated or Refund Approved
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi! I am the Food Fix customer assistant. How can I help you today?", isBot: true },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Convert File to base64
  const handleFileConvert = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, JPEG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileConvert(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileConvert(file);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return;

    // Build the sent message structure
    const userMessage: Message = {
      text: message,
      isBot: false,
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessageString = message;
    const currentImage = selectedImage;
    
    // Reset inputs
    setMessage("");
    setSelectedImage(null);
    scrollToBottom();
    setIsLoading(true);

    try {
      // Clean request history to not send large base64 strings back-and-forth
      // Just keep text representation of the conversation sequence
      const requestHistory = messages.map((m) => ({
        text: m.text,
        isBot: m.isBot,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessageString,
          history: requestHistory,
          image: currentImage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with support agent");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { text: data.text, isBot: true },
      ]);

      if (data.refundProcessed) {
        setMessages((prev) => [
          ...prev,
          {
            text: "🎉 System notification: Your refund has been approved! The amount will be credited to your original payment method in 3 to 7 business days.",
            isBot: true,
            isAction: true,
          },
        ]);
      } else if (data.humanEscalated) {
        setMessages((prev) => [
          ...prev,
          {
            text: "🤝 Connecting you to a live Human Support Representative. Support Ticket: #FX-" + Math.floor(100000 + Math.random() * 900000),
            isBot: true,
            isAction: true,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: "⚠️ System error: I encountered an issue connecting to support. Routing you to human backup...", isBot: true },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          scrollToBottom();
        }}
        className="fixed bottom-8 right-8 p-5 bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/30 z-50 hover:scale-105 transition-transform cursor-pointer"
      >
        <MessageCircle size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="fixed inset-4 sm:bottom-28 sm:right-8 sm:w-96 sm:h-[500px] bg-white shadow-2xl rounded-3xl border border-zinc-100 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
              <div>
                <h3 className="font-black text-base uppercase tracking-wider text-orange-500">Food Fix Assist</h3>
                <p className="text-xs text-zinc-400 font-medium">Virtual Policy & Quality agent</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 relative bg-zinc-50">
              {/* Drag over overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-orange-600/10 backdrop-blur-xs border-4 border-dashed border-orange-500 rounded-2xl flex flex-col items-center justify-center pointer-events-none z-10 m-2">
                  <ImageIcon className="text-orange-600 animate-bounce mb-2" size={48} />
                  <span className="text-sm font-bold text-orange-850">Drop image here to review food quality</span>
                </div>
              )}

              {/* Messages Lists */}
              {messages.map((msg, idx) => {
                if (msg.isAction) {
                  const isRefund = msg.text.includes("refund");
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-4 rounded-2xl border ${
                        isRefund
                          ? "bg-emerald-50/80 border-emerald-100 text-emerald-800"
                          : "bg-amber-50/80 border-amber-100 text-amber-800"
                      }`}
                    >
                      {isRefund ? (
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                      ) : (
                        <UserCheck className="text-amber-500 shrink-0" size={24} />
                      )}
                      <span className="text-xs font-semibold leading-relaxed">{msg.text}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.isBot
                        ? "bg-white text-zinc-800 rounded-tl-none shadow-xs border border-zinc-100 mr-auto"
                        : "bg-orange-600 text-white rounded-tr-none ml-auto shadow-xs"
                    }`}
                  >
                    {/* Render Image if exists */}
                    {msg.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-black/5 max-h-48">
                        <img
                          src={msg.image}
                          alt="Uploaded query reference"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <span className="whitespace-pre-line">{msg.text}</span>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold bg-white border border-zinc-100 shadow-xs rounded-full px-4 py-2 w-max">
                  <Loader2 size={14} className="animate-spin text-orange-600" />
                  <span>Analyzing food content...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Selection Bar */}
            <div className="p-4 border-t border-zinc-100 bg-white space-y-3">
              {/* Selected Image Thumbnail preview */}
              {selectedImage && (
                <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedImage}
                      alt="Preview upload"
                      className="w-10 h-10 object-cover rounded-lg border border-orange-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-orange-950">Food quality reference</p>
                      <p className="text-[10px] text-orange-600">Attached to your next message</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-1 rounded-full text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Text Area Input */}
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-full border border-zinc-200 transition-colors cursor-pointer ${
                    selectedImage
                      ? "bg-orange-100 border-orange-300 text-orange-700"
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                  }`}
                  title="Upload image reference (Drag and Drop is also supported)"
                >
                  <ImageIcon size={20} />
                </button>

                <input
                  type="text"
                  placeholder={
                    selectedImage
                      ? "Add description..."
                      : "Ask about policies or food quality..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-zinc-50 border border-zinc-100 focus:outline-none focus:border-orange-500 rounded-full px-4 py-3 text-sm text-zinc-850 placeholder:text-zinc-400"
                  disabled={isLoading}
                />

                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-orange-600 text-white p-3 rounded-full hover:bg-orange-500 transition-colors cursor-pointer disabled:opacity-55"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
