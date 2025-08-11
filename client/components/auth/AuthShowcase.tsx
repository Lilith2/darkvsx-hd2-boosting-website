import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Sparkles,
  Target,
  CheckCircle,
  Users,
  Lock,
  Mail,
  Eye,
  RefreshCw,
} from "lucide-react";

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast",
    description:
      "Instant validation with smooth animations and micro-interactions",
    color: "text-yellow-400",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure by Design",
    description:
      "Real-time password strength validation and security best practices",
    color: "text-green-400",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Modern UI",
    description: "Beautiful glassmorphism design with particle animations",
    color: "text-purple-400",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Smart Validation",
    description:
      "Progressive validation with helpful error messages and guidance",
    color: "text-orange-400",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Better UX",
    description:
      "Multi-step flows with progress tracking and intuitive navigation",
    color: "text-blue-400",
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: "Auto-Checking",
    description: "Automatic email verification checking with smart retry logic",
    color: "text-red-400",
  },
];

const improvements = [
  "🎨 Modern glassmorphism design with animated backgrounds",
  "⚡ Real-time form validation with debounced input checking",
  "🔒 Advanced password strength indicator with security tips",
  "📧 Enhanced email verification with provider detection",
  "🎯 Multi-step registration with progress tracking",
  "✨ Smooth animations using Framer Motion",
  "🔄 Auto-refresh session checking for email confirmation",
  "📱 Fully responsive design optimized for all devices",
  "🛡️ Security-first approach with validation best practices",
  "🎮 Theme integration with Helldivers brand colors",
];

export function AuthShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            New Authentication System
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A complete overhaul of the login, registration, and email
            verification experience
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className={`${feature.color} mb-4`}>{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Improvements List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            What's New & Improved
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {improvements.map((improvement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex items-center text-gray-300 text-sm"
              >
                <span className="mr-3">{improvement}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            Try the New Authentication System
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center justify-center"
            >
              <Lock className="w-4 h-4 mr-2" />
              New Login Page
            </motion.a>

            <motion.a
              href="/register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center justify-center"
            >
              <Users className="w-4 h-4 mr-2" />
              New Registration
            </motion.a>

            <motion.a
              href="/email-confirmation?email=demo@example.com&type=signup"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center justify-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Verification
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
