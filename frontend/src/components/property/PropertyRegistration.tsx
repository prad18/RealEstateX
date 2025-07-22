import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { verificationService } from '@/services/verificationService';
import { ipfsService } from '@/services/ipfs';
import type { IPFSUploadResult } from '@/services/ipfs';
import { PropertyNFTMinting } from './PropertyNFTMinting';

// --- INTERFACES ---
interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  area: number;
  propertyType: 'residential' | 'commercial' | 'plot';
  coordinates: { lat: number; lon: number };
  owner: string;
  value: { land: number; improvement: number; total: number };
  zoning: { code: string; description: string; type: string; subtype: string };
  legal: { parcelNumber: string; stateParcelNumber: string; legalDescription: string };
  demographics: { medianIncome: number; affordabilityIndex: number; populationDensity: number };
}
interface PropertyValuation {
  estimatedValue: number;
  confidenceScore: number;
  pricePerSqFt: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral'; weight: number; description: string }>;
  lastUpdated: string;
}
interface PropertyRegistrationProps {
  uploadedDocuments: Array<{ file: File; ipfs_hash: string }>;
  onRegistrationComplete: (propertyId: string) => void;
  propertyDetails: PropertyDetails;
  valuation?: PropertyValuation;
  onBackToDashboard?: () => void; // ✨ ACCEPT the prop here
}

// --- FILE UPLOAD COMPONENT ---
const FileUploader = ({ title, onUpload, doc, isLoading }: { title: string; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; doc: { file: File; ipfs_hash: string } | null; isLoading: boolean; }) => (
  <div className="glass-dark p-6 rounded-2xl border border-white/10 space-y-4">
    <h3 className="font-semibold text-white">{title}</h3>
    {!doc ? (<label className={`relative cursor-pointer btn-secondary w-full text-center block ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}><div className="flex items-center justify-center space-x-2">{isLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Uploading...</span></>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg><span>Choose File</span></>)}</div><input type="file" className="hidden" accept="application/pdf,image/*" disabled={isLoading} onChange={onUpload} /></label>) : (<div className="glass rounded-xl p-3 border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-600/10"><p className="text-green-300 text-sm font-medium truncate">✅ {doc.file.name}</p><a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfs_hash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">IPFS: {doc.ipfs_hash}</a></div>)}
  </div>
);

// --- MAIN COMPONENT ---
export const PropertyRegistration: React.FC<PropertyRegistrationProps> = ({ onRegistrationComplete, propertyDetails, valuation, onBackToDashboard }) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [step, setStep] = useState<'upload' | 'property' | 'consent' | 'review'>('upload');
  const [propertyDoc, setPropertyDoc] = useState<{ file: File; ipfs_hash: string } | null>(null);
  const [idDoc, setIdDoc] = useState<{ file: File; ipfs_hash: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [consentSigned, setConsentSigned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verified, setVerified] = useState(false);
  const [activeUploader, setActiveUploader] = useState<'property' | 'id' | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [mintingComplete, setMintingComplete] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  React.useEffect(() => {
    if (step === 'review' && consentSigned && !verifying && !verified && !verificationError) {
      (async () => {
        setVerifying(true);
        setVerificationError('');
        try {
          const formData = new FormData();
          if (propertyDoc?.file) formData.append('title', propertyDoc.file);
          if (idDoc?.file) formData.append('id', idDoc.file);
          const resp = await fetch('http://127.0.0.1:8000/verify', { method: 'POST', body: formData });
          const data = await resp.json();
          if (resp.ok && data.match === true) setVerified(true);
          else setVerificationError(data.error || 'Document verification failed.');
        } catch (err) { setVerificationError('Verification request failed.'); }
        finally { setVerifying(false); }
      })();
    }
  }, [step, consentSigned, verifying, verified, verificationError, propertyDoc?.file, idDoc?.file, retryCount]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setDoc: React.Dispatch<React.SetStateAction<{ file: File; ipfs_hash: string } | null>>, uploaderType: 'property' | 'id') => {
    setError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsLoading(true);
    setActiveUploader(uploaderType);
    try {
      const ipfs: IPFSUploadResult = await ipfsService.uploadFile(file);
      setDoc({ file, ipfs_hash: ipfs.hash });
    } catch (err) {
      setError('IPFS upload failed');
      setDoc(null);
    }
    setIsLoading(false);
    setActiveUploader(null);
  };

  const handleContinue = () => {
    if (propertyDoc && idDoc) setStep('property');
    else setError('Please upload both Property Document and ID Proof');
  };

  const handleSignConsent = async () => {
    if (!address || !propertyDetails) return;
    setIsLoading(true);
    setError('');
    try {
      const consentMessage = `I confirm that I am the legal owner of the property at ${propertyDetails.address} and consent to tokenize this property on the blockchain. Wallet: ${address}`;
      const signature = await signMessageAsync({ message: consentMessage });
      if (signature) { setConsentSigned(true); setStep('review'); }
    } catch (err) { setError('Failed to sign consent message'); }
    finally { setIsLoading(false); }
  };
  
  const handleMintSuccess = (tokenId: number) => {
    setMintingComplete(true);
    setMintedTokenId(tokenId);
  };

  // --- RENDER STEPS ---
  if (step === 'upload') {
    return (
      <div className="card-glass p-8 space-y-8 animate-fade-in">
        <div className="flex items-start justify-between">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Register Property: Step 1</h2>
            {onBackToDashboard && <button onClick={onBackToDashboard} className="btn-secondary">Back to Dashboard</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><FileUploader title="1. Upload Property Document" onUpload={e => handleFileUpload(e, setPropertyDoc, 'property')} doc={propertyDoc} isLoading={isLoading && activeUploader === 'property'} /><FileUploader title="2. Upload ID Proof" onUpload={e => handleFileUpload(e, setIdDoc, 'id')} doc={idDoc} isLoading={isLoading && activeUploader === 'id'} /></div>
        {error && ( <p className="text-red-400 text-center">{error}</p> )}
        <button onClick={handleContinue} disabled={isLoading || !propertyDoc || !idDoc} className="w-full btn-primary text-lg py-4">Continue</button>
      </div>
    );
  }
  
  if (step === 'property') {
    return (
      <div className="card-glass p-8 space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Confirm Details: Step 2</h2>
            {onBackToDashboard && <button onClick={onBackToDashboard} className="btn-secondary">Back to Dashboard</button>}
        </div>
        <div className="glass-dark p-6 rounded-2xl border border-white/10 space-y-3"><p className="text-white"><strong>Address:</strong> {propertyDetails.address}</p><p className="text-white"><strong>Owner:</strong> {propertyDetails.owner}</p><p className="text-white"><strong>Assessed Value:</strong> {propertyDetails.value.total > 0 ? `$${propertyDetails.value.total.toLocaleString()}` : 'Not assessed'}</p><p className="text-green-400"><strong>Uploaded Docs:</strong> Property Title ✅, ID Proof ✅</p></div>
        {error && <p className="text-red-400 text-center">{error}</p>}
        <div className="flex gap-4"><button onClick={() => setStep('upload')} className="w-full btn-secondary text-lg py-4">Back</button><button onClick={handleSignConsent} disabled={isLoading} className="w-full btn-primary text-lg py-4 bg-green-600 hover:bg-green-700">{isLoading ? 'Signing...' : 'Sign & Continue'}</button></div>
      </div>
    );
  }
  
  if (step === 'review' && consentSigned) {
    if (verifying) {
      return (<div className="card-glass p-8 flex flex-col items-center justify-center space-y-4"><div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div><p className="text-blue-300 font-semibold text-xl">Verifying your documents...</p><p className="text-gray-400 text-sm text-center">AI is analyzing document data against ownership records.</p></div>);
    }

    if (verificationError) {
      return (<div className="card-glass p-8 flex flex-col items-center justify-center space-y-4"><h3 className="text-2xl font-bold text-red-400">Verification Failed</h3><p className="text-red-300 text-center">{verificationError}</p><button onClick={() => { setVerificationError(''); setRetryCount(prev => prev + 1); }} className="btn-secondary mt-4">Try Again</button></div>);
    }
    
    if (verified) {
      if (!mintingComplete) {
        return (
          <div className="card-glass p-8 space-y-6 animate-fade-in">
            <div className="text-center"><h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Mint Property NFT: Final Step</h2><p className="text-green-400 mt-2 font-semibold">✅ Ownership Verified!</p></div>
            <div className="glass-dark p-6 rounded-2xl border border-white/10 space-y-3"><p className="text-white"><strong>Address:</strong> {propertyDetails.address}</p><p className="text-white"><strong>Owner:</strong> {propertyDetails.owner}</p><p className="text-white"><strong>Market Value:</strong> {valuation ? `$${valuation.estimatedValue.toLocaleString()}` : 'N/A'}</p></div>
            <div className="w-full">
              <PropertyNFTMinting 
                propertyDetails={propertyDetails} 
                valuation={valuation} 
                assetIpfsHash={propertyDoc?.ipfs_hash} 
                onMintSuccess={handleMintSuccess}
                onBackToDashboard={onBackToDashboard} // ✨ PASS the prop down
              />
            </div>
          </div>
        );
      } else {
        return (
          <div className="card-glass p-8 flex flex-col items-center justify-center space-y-6 animate-scale-in">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-glow"><svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
            <h2 className="text-3xl font-bold text-white">Minting Complete!</h2>
            <p className="text-gray-300">Your property has been successfully tokenized.</p>
            <div className="glass-dark p-4 rounded-xl text-center"><p className="text-gray-400 text-sm">NFT Token ID</p><p className="text-white font-bold text-lg">{mintedTokenId}</p></div>
            <button onClick={() => onRegistrationComplete('flow_complete')} className="w-full max-w-xs btn-primary text-lg py-3 mt-4">Back to Dashboard</button>
          </div>
        );
      }
    }
    
    return null;
  }

  return null;
};