import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { web3Service, type PropertyData, type TokenBalance } from '@/services/web3Service';
import { DocumentUpload } from '@/components/upload/DocumentUpload';
import { PropertyRegistration } from '@/components/property/PropertyRegistration';
import { VerificationStatus } from '@/components/verification/VerificationStatus';
import { CoordinatePropertyLookup } from '@/components/property/CoordinatePropertyLookup';
import { FaucetLink } from '@/components/wallet/FaucetLink';
import { type VerificationResult } from '@/services/verificationService';

export const Dashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New state for property registration flow
  const [currentFlow, setCurrentFlow] = useState<'dashboard' | 'property-lookup' | 'upload' | 'register' | 'verify'>('dashboard');
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ file: File; ipfs_hash: string }>>([]);
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null);

  // Fetch data when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchDashboardData();
    }
  }, [isConnected, address]);

  const fetchDashboardData = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      const [userProperties, balance] = await Promise.all([
        web3Service.getUserProperties(address),
        web3Service.getTokenBalance(address)
      ]);
      
      setProperties(userProperties);
      setTokenBalance(balance);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (documents: Array<{ file: File; ipfs_hash: string }>) => {
    setUploadedDocuments(documents);
    setCurrentFlow('register');
  };

  const handleRegistrationComplete = (propertyId: string) => {
    setCurrentPropertyId(propertyId);
    setCurrentFlow('verify');
    // Refresh dashboard data
    fetchDashboardData();
  };

  const handleVerificationComplete = (result: VerificationResult) => {
    console.log('Verification completed:', result);
    if (result.finalApproval) {
      setCurrentFlow('dashboard');
      setCurrentPropertyId(null);
      setUploadedDocuments([]);
      fetchDashboardData();
    }
  };

  const handleBackToDashboard = () => {
    setCurrentFlow('dashboard');
    setCurrentPropertyId(null);
    setUploadedDocuments([]);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">Please connect your wallet to access the dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">RealEstateX Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your tokenized real estate assets on BlockDAG</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <FaucetLink />
        </div>
      </div>

      {/* Flow Navigation */}
      {currentFlow !== 'dashboard' && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentFlow === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Upload Documents</span>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentFlow === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Register Property</span>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentFlow === 'verify' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Verification</span>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Content Based on Current Flow */}
      {currentFlow === 'dashboard' && (
        <>
          {/* Token Balances */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{tokenBalance?.propertyCount || 0}</div>
                <div className="text-sm text-gray-600">Property NFTs</div>
                <div className="text-xs text-gray-500 mt-1">Real estate tokens owned</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{tokenBalance?.homedBalance || '0'}</div>
                <div className="text-sm text-gray-600">$HOMED Balance</div>
                <div className="text-xs text-gray-500 mt-1">Stablecoins available</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => setCurrentFlow('property-lookup')}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <div className="text-lg font-medium text-gray-900">🔍 Property Lookup</div>
                <div className="text-sm text-gray-600 mt-1">Look up real property data by coordinates</div>
              </button>
              <button 
                onClick={() => setCurrentFlow('upload')}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <div className="text-lg font-medium text-gray-900">🏠 Register Property</div>
                <div className="text-sm text-gray-600 mt-1">Upload documents and register new property</div>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50">
                <div className="text-lg font-medium text-gray-900">💰 Mint $HOMED</div>
                <div className="text-sm text-gray-600 mt-1">Generate stablecoins from your property</div>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50">
                <div className="text-lg font-medium text-gray-900">📊 View Analytics</div>
                <div className="text-sm text-gray-600 mt-1">Monitor your portfolio performance</div>
              </button>
            </div>
          </div>

          {/* Properties Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Properties</h2>
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900">{property.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{property.address}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-600">
                        ${property.value.toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        property.verificationStatus === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : property.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {property.verificationStatus}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {property.documents.length} documents • {property.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">🏠</div>
                <p className="text-gray-600">No properties registered yet</p>
                <p className="text-sm text-gray-500">Click "Register Property" to get started</p>
              </div>
            )}
          </div>

          {/* Network Info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Network Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Network</div>
                <div className="text-lg font-medium">BlockDAG Testnet</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Chain ID</div>
                <div className="text-lg font-medium">1043</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Property Lookup Flow */}
      {currentFlow === 'property-lookup' && (
        <CoordinatePropertyLookup />
      )}

      {/* Upload Flow */}
      {currentFlow === 'upload' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Property Documents</h2>
          <p className="text-gray-600 mb-6">
            Please upload all required documents for your property. These will be stored securely on IPFS.
          </p>
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Registration Flow */}
      {currentFlow === 'register' && uploadedDocuments.length > 0 && (
        <PropertyRegistration
          uploadedDocuments={uploadedDocuments}
          onRegistrationComplete={handleRegistrationComplete}
        />
      )}

      {/* Verification Flow */}
      {currentFlow === 'verify' && currentPropertyId && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Property Verification</h2>
            <p className="text-gray-600 mb-6">
              Your property is now being verified through our hybrid system. This process includes AI analysis followed by manual review.
            </p>
          </div>
          <VerificationStatus
            propertyId={currentPropertyId}
            onVerificationUpdate={handleVerificationComplete}
          />
        </div>
      )}
    </div>
  );
};
