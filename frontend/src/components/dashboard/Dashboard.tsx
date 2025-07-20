import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { web3Service, type PropertyData } from '@/services/web3Service';
import { DocumentUpload } from '@/components/upload/DocumentUpload';
import { PropertyRegistration } from '@/components/property/PropertyRegistration';
import { VerificationStatus } from '@/components/verification/VerificationStatus';
import { CoordinatePropertyLookup } from '@/components/property/CoordinatePropertyLookup';
import { MintPopup } from '@/components/ui/MintPopup';
import { FaucetLink } from '@/components/wallet/FaucetLink';
import { type VerificationResult } from '@/services/verificationService';
import { balanceof, getCountofProperty } from '@/services/contracts';
import { Repay } from '@/components/Repay/Repay';

// --- Helper Components ---

// Animated statistics component
const StatCard = ({
  title,
  value,
  icon,
  delay = 0,
}: {
  title: string;
  value: string | number | bigint; // Allow bigint as a prop type
  icon: React.ReactNode;
  delay?: number;
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let targetValue: number;

      // FIX: Explicitly handle string, number, and bigint types
      if (typeof value === 'bigint') {
        // Convert BigInt to a standard number for animation.
        // This is safe for display purposes unless the balance exceeds Number.MAX_SAFE_INTEGER.
        targetValue = Number(value);
      } else if (typeof value === 'string') {
        targetValue = parseFloat(value) || 0;
      } else if (typeof value === 'number') {
        targetValue = value;
      } else {
        targetValue = 0;
      }
      
      // Now that targetValue is guaranteed to be a number, isNaN is safe.
      if (isNaN(targetValue)) {
        setAnimatedValue(0);
        return;
      }

      // A simple animation effect to count up
      const duration = 1000; // 1 second
      const frameRate = 60; // 60fps
      const totalFrames = duration / (1000 / frameRate);
      const increment = targetValue / totalFrames;
      let currentVal = 0;

      const counter = setInterval(() => {
        currentVal += increment;
        if (currentVal >= targetValue) {
          setAnimatedValue(targetValue);
          clearInterval(counter);
        } else {
          setAnimatedValue(currentVal);
        }
      }, 1000 / frameRate);

      return () => clearInterval(counter);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);


  return (
    <div className="interactive-card glass-dark rounded-2xl p-6 magnetic-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="gradient-border w-12 h-12">
          <div className="gradient-border-content w-full h-full flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white mb-1">
          {Math.floor(animatedValue).toLocaleString()}
        </div>
        <div className="text-sm text-gray-400">{title}</div>
      </div>
    </div>
  );
};


// --- Main Dashboard Component ---

type FlowType = 'dashboard' | 'property-lookup' | 'upload' | 'register' | 'verify' | 'repay' | 'mint-homed';

export const Dashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFlow, setCurrentFlow] = useState<FlowType>('dashboard');
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ file: File; ipfs_hash: string }>>([]);
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | bigint>("0");
  const [propertyCount, setPropertyCount] = useState<string>("0");
  const [showMintPopup, setShowMintPopup] = useState<boolean>(false);
  
  // New state to hold the specific token ID for minting
  const [tokenToMintFrom, setTokenToMintFrom] = useState<number | null>(null);

  // Effect to manage the visibility of the minting popup
  useEffect(() => {
    if (currentFlow === 'mint-homed') {
      setShowMintPopup(true);
    } else {
      setShowMintPopup(false);
    }
  }, [currentFlow]);

  // Fetches all necessary data for the dashboard
  const fetchDashboardData = useCallback(async () => {
    if (!address) return;
    try {
      setIsLoading(true);
      const [userProperties, userBalance, propCount] = await Promise.all([
        web3Service.getUserProperties(address),
        balanceof(address),
        getCountofProperty(address),
      ]);
      setProperties(userProperties);
      setBalance(userBalance); // This can be a BigInt
      setPropertyCount(propCount);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchDashboardData();
    }
  }, [isConnected, address, fetchDashboardData]);

  // --- Flow Handlers ---

  const handleUploadComplete = (documents: Array<{ file: File; ipfs_hash: string }>) => {
    setUploadedDocuments(documents);
    setCurrentFlow('register');
  };

  const handleRegistrationComplete = (propertyId: string) => {
    setCurrentPropertyId(propertyId);
    setCurrentFlow('verify');
    fetchDashboardData();
  };

  const handleVerificationComplete = (result: VerificationResult) => {
    if (result.finalApproval) {
      handleBackToDashboard();
      fetchDashboardData();
    }
  };

  const handleBackToDashboard = () => {
    setCurrentFlow('dashboard');
    setCurrentPropertyId(null);
    setUploadedDocuments([]);
  };
  
  // --- Minting Handlers ---
  
  const handleInitiateMint = (property: PropertyData) => {
    const numericId = parseInt(property.id.replace('prop_', ''));
    if (!isNaN(numericId)) {
      setTokenToMintFrom(numericId);
      setCurrentFlow('mint-homed');
    } else {
      console.error("Could not determine token ID from property:", property);
      setTokenToMintFrom(null);
      setCurrentFlow('mint-homed');
    }
  };

  const handleMintSuccess = () => {
    fetchDashboardData();
    setCurrentFlow('dashboard');
    setTokenToMintFrom(null);
  };

  const handleMintError = (error: string) => {
    console.error('Minting error:', error);
  };

  // --- Render Logic ---

  if (!isConnected) {
    return (
      <div className="card-glass text-center py-16 animate-scale-in">
        <div className="w-16 h-16 mx-auto mb-6 glass rounded-2xl flex items-center justify-center">
           <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
           </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
        <p className="text-white/70">Please connect your wallet to access the dashboard</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-glass text-center py-16 animate-pulse">
        <div className="w-16 h-16 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h3>
        <p className="text-white/70">Fetching your data from the blockchain...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="card-glass animate-fade-in-down p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">RealEstateX Dashboard</h1>
            <p className="text-gray-300 mt-2">Manage your tokenized real estate assets on BlockDAG</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="glass rounded-lg px-3 py-1 text-sm text-gray-200 border border-white/20">
                <span className="text-gray-400">Connected:</span> {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <FaucetLink />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wide">BlockDAG Network</div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300 font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Registration Flow Stepper */}
      {['upload', 'register', 'verify'].includes(currentFlow) && (
        <div className="card-glass animate-slide-in-right p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 mb-4 md:mb-0">
              {['upload', 'register', 'verify'].map((flow, index) => (
                <React.Fragment key={flow}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${currentFlow === flow ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-glow" : "bg-white/20 text-white/60"}`}>
                      <span className="font-semibold">{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-white capitalize">{flow}</span>
                  </div>
                  {index < 2 && <div className="h-px w-4 sm:w-8 bg-white/20"></div>}
                </React.Fragment>
              ))}
            </div>
            <button onClick={handleBackToDashboard} className="btn-secondary text-sm">
                Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard View */}
      {currentFlow === 'dashboard' && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <StatCard title="Property NFTs" value={propertyCount || "0"} icon={<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} delay={100}/>
             <StatCard title="$HOMED Balance" value={balance || "0"} icon={<svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} delay={200} />
          </div>

          {/* Quick Actions */}
          <div className="card-glass animate-fade-in-up p-6" style={{ animationDelay: "0.2s" }}>
             <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">Quick Actions</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => setCurrentFlow('property-lookup')} className="interactive-card glass-dark rounded-2xl p-4 text-left magnetic-hover group">
                   <div className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">🔍 Property Lookup</div>
                   <div className="text-sm text-gray-400">Search by coordinates</div>
                </button>
                <button onClick={() => setCurrentFlow('upload')} className="interactive-card glass-dark rounded-2xl p-4 text-left magnetic-hover group">
                   <div className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">🏠 Register Property</div>
                   <div className="text-sm text-gray-400">Onboard a new asset</div>
                </button>
                <button onClick={() => { setTokenToMintFrom(null); setCurrentFlow('mint-homed'); }} className="interactive-card glass-dark rounded-2xl p-4 text-left magnetic-hover group">
                   <div className="text-lg font-bold text-white mb-1 group-hover:text-green-300 transition-colors">💰 Mint $HOMED</div>
                   <div className="text-sm text-gray-400">Generate stablecoins</div>
                </button>
                <button onClick={() => setCurrentFlow('repay')} className="interactive-card glass-dark rounded-2xl p-4 text-left magnetic-hover group">
                   <div className="text-lg font-bold text-white mb-1 group-hover:text-orange-300 transition-colors">📊 Repay Loan</div>
                   <div className="text-sm text-gray-400">Manage your debt</div>
                </button>
             </div>
          </div>
          
          {/* Your Properties List */}
          <div className="card-glass animate-fade-in-up p-6" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-2xl font-bold text-white mb-6">Your Properties</h2>
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property, index) => (
                  <div key={property.id} className="glass rounded-2xl p-6 border border-white/20 hover:border-white/40 flex flex-col justify-between transition-all duration-300 transform hover:scale-105" style={{ animationDelay: `${0.1 * index}s` }}>
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-white text-lg">{property.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${property.verificationStatus === "verified" ? "bg-green-500/20 text-green-400" : property.verificationStatus === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{property.verificationStatus}</span>
                      </div>
                      <p className="text-white/70 text-sm mb-4 line-clamp-2">{property.address}</p>
                      <div className="text-2xl font-bold text-white">${property.value.toLocaleString()}</div>
                      <div className="text-white/60 text-xs mt-1">{property.documents.length} docs • {property.createdAt.toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => handleInitiateMint(property)}
                      className="mt-4 w-full btn-primary bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                      Mint from this Property
                    </button>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center py-16">
                 <h3 className="text-xl font-semibold text-white mb-2">No Properties Yet</h3>
                 <p className="text-white/70 mb-6">Click "Register Property" to get started</p>
               </div>
            )}
          </div>
        </div>
      )}
      
      {/* Screens for Non-Dashboard and Non-Minting Flows */}
      {currentFlow !== 'dashboard' && currentFlow !== 'mint-homed' && (
        <div className="card-glass p-8 animate-fade-in">
          {currentFlow === 'property-lookup' && <CoordinatePropertyLookup />}
          {currentFlow === 'upload' && <DocumentUpload onUploadComplete={handleUploadComplete} />}
          {currentFlow === 'register' && uploadedDocuments.length > 0 && <PropertyRegistration uploadedDocuments={uploadedDocuments} onRegistrationComplete={handleRegistrationComplete} />}
          {currentFlow === 'verify' && currentPropertyId && <VerificationStatus propertyId={currentPropertyId} onVerificationUpdate={handleVerificationComplete} />}
          {currentFlow === 'repay' && <Repay />}
        </div>
      )}

      {/* Minting Popup (Modal) */}
      <MintPopup
        isOpen={showMintPopup}
        onClose={() => {
          setCurrentFlow('dashboard');
          setTokenToMintFrom(null); // Reset on close
        }}
        onMintSuccess={handleMintSuccess}
        onMintError={handleMintError}
        preSelectedTokenId={tokenToMintFrom}
      />
    </div>
  );
};