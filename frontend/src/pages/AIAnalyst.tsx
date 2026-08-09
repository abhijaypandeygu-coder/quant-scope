import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, FileText, Activity, TrendingUp } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

export function AIAnalyst() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hello! I am your AI Financial Analyst. I can help you analyze SEC filings, review portfolio risk, and parse market sentiment. What would you like to explore today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (query: string) => {
    if (!query.trim() || loading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query, context: {} })
      });
      const data = await res.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.response || "I'm sorry, I couldn't process that request."
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Network error connecting to the AI brain."
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (loading) return;
    
    let simulatedQuery = "";
    if (action === "sentiment") {
      simulatedQuery = "What is the current news sentiment for Apple (AAPL)?";
    } else if (action === "sec") {
      simulatedQuery = "Analyze the key risks in AAPL's latest 10-K filing.";
    } else if (action === "risk") {
      simulatedQuery = "How can I hedge the tech risk in my portfolio?";
    }

    await handleSend(simulatedQuery);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          AI Financial Analyst
        </h2>
        <p className="text-muted-foreground mt-2">
          Powered by large language models. Ask about market dynamics, SEC filings, or portfolio risks.
        </p>
      </div>

      <div className="flex gap-4">
        <button onClick={() => handleQuickAction("sentiment")} className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-sm">
          <TrendingUp className="w-4 h-4 text-primary" />
          Analyze AAPL Sentiment
        </button>
        <button onClick={() => handleQuickAction("sec")} className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-sm">
          <FileText className="w-4 h-4 text-primary" />
          Parse AAPL 10-K Risks
        </button>
        <button onClick={() => handleQuickAction("risk")} className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-sm">
          <Activity className="w-4 h-4 text-primary" />
          Hedge Tech Portfolio
        </button>
      </div>

      <div className="flex-1 bg-card border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-sm">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-white/5 border border-white/10 rounded-tl-sm text-foreground"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 border border-white/10">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-black/20 border-t border-white/10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI Analyst..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-3">
            AI responses are generated by a simulated RAG pipeline for demonstration purposes. Do not use for real financial decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
