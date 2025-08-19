import Link from "next/link";
import { useState, useEffect } from "react";
import { AlertTriangle, Rocket, Zap, Shield, Crosshair } from "lucide-react";

export default function Custom404() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [glitchText, setGlitchText] = useState("404");
  const [randomFact, setRandomFact] = useState("");

  // Initialize random fact on client to prevent hydration mismatch
  useEffect(() => {
    const bugFacts = [
      "🐛 A Charger destroyed this page coordinates",
      "🔥 Orbital bombardment wiped out this sector",
      "⚡ EMS Artillery caused data corruption",
      "🚀 Extraction ship couldn't find landing zone",
      "💥 Strategem malfunction detected",
    ];
    setRandomFact(bugFacts[Math.floor(Math.random() * bugFacts.length)]);
  }, []);

  // Glitch effect for the 404 text
  useEffect(() => {
    const glitchChars = ["4", "0", "4", "Ø", "£", "#", "@", "∆", "◊"];
    const interval = setInterval(() => {
      const glitched = Array.from("404")
        .map((char, i) =>
          Math.random() > 0.7
            ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
            : char,
        )
        .join("");
      setGlitchText(glitched);

      setTimeout(() => setGlitchText("404"), 150);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleExtraction = () => {
    setIsExtracting(true);
    setTimeout(() => setIsExtracting(false), 3000);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_50%)]" />
      <div className="absolute top-10 left-10 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <div className="absolute top-20 right-16 w-1 h-1 bg-yellow-500 rounded-full animate-ping" />
      <div className="absolute bottom-20 left-20 w-1 h-1 bg-blue-500 rounded-full animate-pulse" />

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-2xl mx-auto relative">
          {/* Alert Icon */}
          <div className="mb-8 relative">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto animate-bounce" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>

          {/* Glitchy 404 */}
          <div className="relative mb-6">
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-red-600 bg-clip-text animate-pulse">
              {glitchText}
            </h1>
            <div className="absolute inset-0 text-8xl md:text-9xl font-black text-red-500/20 blur-sm">
              404
            </div>
          </div>

          {/* Military-style Title */}
          <div className="mb-8 p-6 bg-gradient-to-r from-red-900/30 to-yellow-900/30 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 uppercase tracking-wider">
              ⚠️ MISSION COMPROMISED ⚠️
            </h2>
            <h3 className="text-xl md:text-2xl font-semibold text-red-400 mb-4">
              PAGE COORDINATES LOST
            </h3>

            <div className="text-center space-y-2 mb-6">
              <p className="text-lg text-orange-300 font-medium">
                🦅 SUPER EARTH COMMAND TRANSMISSION 🦅
              </p>
              <p className="text-muted-foreground">{randomFact || "🔥 Democracy is temporarily unavailable"}</p>
              <p className="text-blue-300 text-sm italic">
                "Democracy never sleeps, but sometimes URLs do."
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                RETURN TO BASE
                <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              <button
                onClick={handleExtraction}
                disabled={isExtracting}
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Zap className="w-5 h-5 mr-2 animate-spin" />
                    EXTRACTING...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    CALL EXTRACTION
                  </>
                )}
              </button>
            </div>

            {isExtracting && (
              <div className="mt-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg animate-fade-in">
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <Crosshair className="w-5 h-5 animate-spin" />
                  <span className="font-mono">
                    EXTRACTION BEACON ACTIVATED...
                  </span>
                </div>
                <div className="w-full bg-green-900/50 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-400 h-2 rounded-full animate-pulse"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Message */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              🎖️ <strong>Helldiver Tip:</strong> Always check your coordinates
              before diving!
            </p>
            <p className="text-xs text-muted-foreground/70">
              For Liberty! For Democracy! For... properly working URLs! 🫡
            </p>
          </div>

          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 text-4xl animate-float">
            🚀
          </div>
          <div
            className="absolute -top-2 -right-8 text-2xl animate-float"
            style={{ animationDelay: "1s" }}
          >
            ⚡
          </div>
          <div
            className="absolute -bottom-4 left-8 text-3xl animate-float"
            style={{ animationDelay: "2s" }}
          >
            🛡️
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        @keyframes matrix-rain {
          0% {
            transform: translateY(-100vh);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        .matrix-char {
          position: absolute;
          color: #00ff00;
          font-family: "Courier New", monospace;
          font-size: 14px;
          animation: matrix-rain 3s linear infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Matrix rain effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="matrix-char"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {Math.random() > 0.5 ? "01001" : "11010"}
          </div>
        ))}
      </div>
    </div>
  );
}
