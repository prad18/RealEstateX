import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config/wallet";
import { WalletConnect } from "./components/wallet/WalletConnect";
import { Dashboard } from "./components/dashboard/Dashboard";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Animated statistics counter
const AnimatedCounter = ({
  value,
  label,
  prefix = "",
  suffix = "",
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const increment = value / 50;
      const interval = setInterval(() => {
        setCount((prev) => {
          const next = prev + increment;
          if (next >= value) {
            clearInterval(interval);
            return value;
          }
          return next;
        });
      }, 50);
      return () => clearInterval(interval);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Format large numbers in a compact way
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toLocaleString();
  };

  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-white mb-2 break-words">
        {prefix}
        {formatNumber(Math.floor(count))}
        {suffix}
      </div>
      <div className="text-gray-300 text-xs md:text-sm">{label}</div>
    </div>
  );
};

function AppContent() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Static background elements only - removed moving particles and orbs */}

      {/* Cyber grid background - static */}
      <div className="absolute inset-0 cyber-grid opacity-5"></div>

      {/* Static decorative elements without animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <header className="glass-dark backdrop-blur-xl border-b border-white/10 relative z-10 animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 animate-slide-in-left">
              <div className="relative magnetic-hover">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow animate-breathe">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-bounce">
                  <div className="pulse-ring absolute inset-0"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                  RealEstateX
                </h1>
                <p className="text-sm text-gray-400">
                  Blockchain Property Platform
                </p>
              </div>
            </div>
            <div className="animate-slide-in-right">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {isConnected ? (
          <div className="animate-fade-in-up">
            <Dashboard />
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-4xl mx-auto">
              {/* Hero icon with enhanced animations */}
              <div className="relative mb-12 flex justify-center">
                <div className="card-3d">
                  <div className="card-3d-inner w-40 h-40 glass rounded-3xl flex items-center justify-center mx-auto magnetic-hover shadow-glow">
                    <svg
                      className="w-20 h-20 text-blue-400 animate-breathe"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 gradient-border animate-scale-bounce">
                  <div className="gradient-border-content w-full h-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Enhanced hero content */}
              <div className="space-y-8 mb-16">
                <h2
                  className="text-5xl md:text-7xl font-bold text-white text-shadow-lg animate-text-reveal"
                  style={{ animationDelay: "0.2s" }}
                >
                  Your Gateway to{" "}
                  <span className="relative">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-xy bg-300% neon-text">
                      Web3 Real Estate
                    </span>
                  </span>
                </h2>
                <p
                  className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto animate-slide-up-reveal"
                  style={{ animationDelay: "0.4s" }}
                >
                  Tokenize real estate assets on{" "}
                  <span className="font-semibold text-blue-400">BlockDAG</span>{" "}
                  and mint{" "}
                  <span className="font-semibold text-yellow-400">$HOMED</span>{" "}
                  stablecoins.
                  <br />
                  Experience the future of property investment with cutting-edge
                  blockchain technology.
                </p>

                {/* Interactive statistics */}
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto py-12 px-4 animate-fade-in-up"
                  style={{ animationDelay: "0.6s" }}
                >
                  <div className="interactive-card glass-dark rounded-2xl p-6 md:p-8">
                    <AnimatedCounter
                      value={1250}
                      label="Properties Tokenized"
                      suffix="+"
                    />
                  </div>
                  <div className="interactive-card glass-dark rounded-2xl p-6 md:p-8">
                    <AnimatedCounter
                      value={1200000}
                      label="Total Value Locked"
                      prefix="$"
                    />
                  </div>
                  <div className="interactive-card glass-dark rounded-2xl p-6 md:p-8">
                    <AnimatedCounter
                      value={25000}
                      label="$HOMED Minted"
                      suffix="+"
                    />
                  </div>
                  <div className="interactive-card glass-dark rounded-2xl p-6 md:p-8">
                    <AnimatedCounter
                      value={800}
                      label="Active Users"
                      suffix="+"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced feature showcase */}
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div
                  className="interactive-card card-3d animate-fade-in-up"
                  style={{ animationDelay: "0.8s" }}
                >
                  <div className="card-3d-inner glass-dark rounded-2xl p-8 h-full">
                    <div className="gradient-border w-16 h-16 mx-auto mb-6">
                      <div className="gradient-border-content w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Military-Grade Security
                    </h3>
                    <p className="text-gray-300">
                      Connect your Web3 wallet with enterprise-level security
                      protocols
                    </p>
                  </div>
                </div>

                <div
                  className="interactive-card card-3d animate-fade-in-up"
                  style={{ animationDelay: "1s" }}
                >
                  <div className="card-3d-inner glass-dark rounded-2xl p-8 h-full">
                    <div className="gradient-border w-16 h-16 mx-auto mb-6">
                      <div className="gradient-border-content w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Decentralized Storage
                    </h3>
                    <p className="text-gray-300">
                      Upload property documents to IPFS with immutable proof of
                      ownership
                    </p>
                  </div>
                </div>

                <div
                  className="interactive-card card-3d animate-fade-in-up"
                  style={{ animationDelay: "1.2s" }}
                >
                  <div className="card-3d-inner glass-dark rounded-2xl p-8 h-full">
                    <div className="gradient-border w-16 h-16 mx-auto mb-6">
                      <div className="gradient-border-content w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Instant Liquidity
                    </h3>
                    <p className="text-gray-300">
                      Generate $HOMED stablecoins from verified properties
                      instantly
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive getting started section */}
              <div
                className="gradient-border max-w-2xl mx-auto animate-scale-bounce"
                style={{ animationDelay: "1.4s" }}
              >
                <div className="gradient-border-content">
                  <h3 className="text-2xl font-semibold text-white mb-8 text-center">
                    Start Your Web3 Journey
                  </h3>
                  <div className="space-y-6">
                    <div className="interactive-card flex items-center space-x-6 p-6 rounded-xl glass">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center animate-breathe">
                          <span className="text-white text-lg font-bold">
                            1
                          </span>
                        </div>
                        <div className="pulse-ring absolute inset-0"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg">
                          Connect Wallet
                        </h4>
                        <p className="text-gray-300 text-sm">
                          Securely connect your Web3 wallet to get started
                        </p>
                      </div>
                      <div className="liquid-button px-4 py-2 text-sm">
                        Connect Now
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 p-6 rounded-xl bg-white/5 border border-white/10 opacity-60">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">2</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-400 font-semibold text-lg">
                          Upload Documents
                        </h4>
                        <p className="text-gray-500 text-sm">
                          Upload and verify your property documents
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 p-6 rounded-xl bg-white/5 border border-white/10 opacity-40">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">3</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-500 font-semibold text-lg">
                          Mint Tokens
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Generate $HOMED tokens from your property
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Enhanced footer */}
      <footer className="relative z-10 mt-20 py-12 glass-dark backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <span className="text-xl font-bold text-white">
                  RealEstateX
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Revolutionizing real estate through blockchain technology and
                decentralized finance.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 glass rounded-lg flex items-center justify-center magnetic-hover cursor-pointer">
                  <svg
                    className="w-4 h-4 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </div>
                <div className="w-8 h-8 glass rounded-lg flex items-center justify-center magnetic-hover cursor-pointer">
                  <svg
                    className="w-4 h-4 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378 0 0-.599 2.282-.744 2.840-.282 1.084-1.064 2.456-1.549 3.235C9.584 23.815 10.77 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
                  </svg>
                </div>
                <div className="w-8 h-8 glass rounded-lg flex items-center justify-center magnetic-hover cursor-pointer">
                  <svg
                    className="w-4 h-4 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Product links */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Property Tokenization
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    HOMED Stablecoin
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Document Storage
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Verification
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources links */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Whitepaper
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Company links */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 RealEstateX. Powered by BlockDAG Network.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;