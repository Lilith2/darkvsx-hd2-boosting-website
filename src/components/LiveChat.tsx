import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  X,
  Send,
  Minimize2,
  User,
  Bot,
  Circle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  from: "user" | "agent" | "bot";
  message: string;
  timestamp: string;
  agentName?: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    from: "bot",
    message:
      "Hello! Welcome to Helldivers Boost support. How can I help you today?",
    timestamp: new Date().toISOString(),
  },
];

const autoResponses = [
  "Thank you for your message! A support agent will be with you shortly.",
  "I understand you need help. Let me connect you with our live support team.",
  "For immediate assistance with orders, please provide your order ID.",
  "Our team is online and ready to help! What specific service are you interested in?",
  "You can also join our Discord community for faster support: https://discord.gg/helldivers2boost",
];

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      from: "user",
      message: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        from: "agent",
        message:
          autoResponses[Math.floor(Math.random() * autoResponses.length)],
        timestamp: new Date().toISOString(),
        agentName: "Sarah",
      };

      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);

      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    }, 2000);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg relative"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              {unreadCount}
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card
        className={`w-80 transition-all duration-300 shadow-2xl ${isMinimized ? "h-14" : "h-96"} border-primary/20`}
      >
        <CardHeader className="p-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Live Support
              <div className="ml-2 flex items-center text-xs opacity-75">
                <Circle className="w-3 h-3 mr-1 fill-current" />
                Online
              </div>
            </CardTitle>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-6 h-6 p-0 hover:bg-white/20"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 p-0 hover:bg-white/20"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0 h-72 flex flex-col">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${message.from === "user" ? "order-2" : "order-1"}`}
                    >
                      <div
                        className={`rounded-lg p-2 text-sm ${
                          message.from === "user"
                            ? "bg-primary text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {message.from === "agent" && (
                          <div className="text-xs opacity-75 mb-1 flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {message.agentName}
                          </div>
                        )}
                        {message.from === "bot" && (
                          <div className="text-xs opacity-75 mb-1 flex items-center">
                            <Bot className="w-3 h-3 mr-1" />
                            Support Bot
                          </div>
                        )}
                        {message.message}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-right">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-lg p-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border p-3">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 text-sm"
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button
                    onClick={sendMessage}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
