/**
 * @fileoverview Property Registration Component
 * @module components/property/PropertyRegistration
 * 
 * The PropertyRegistration component handles the complete property registration workflow,
 * including property details collection, real-time valuation, user consent signing,
 * and verification submission. This component integrates with multiple services to
 * provide a seamless user experience.
 * 
 * @example
 * ```tsx
 * <PropertyRegistration
 *   uploadedDocuments={[
 *     { file: File, ipfs_hash: 'QmHash1' },
 *     { file: File, ipfs_hash: 'QmHash2' }
 *   ]}
 *   onRegistrationComplete={(propertyId) => {
 *     console.log('Property registered:', propertyId)
 *   }}
 * />
 * ```
 * 
 * @since 1.0.0
 * @author RealEstateX Team
 */

import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { 
  propertyValuationService, 
  type PropertyDetails, 
  type ValuationResult, 
  type MintCalculation 
} from '@/services/propertyValuation';
import { verificationService } from '@/services/verificationService';

/**
 * Props interface for the PropertyRegistration component
 * 
 * @interface PropertyRegistrationProps
 */
interface PropertyRegistrationProps {
  /** Array of uploaded documents with their IPFS hashes */
  uploadedDocuments: Array<{ 
    /** The original file object */
    file: File; 
    /** IPFS hash of the uploaded file */
    ipfs_hash: string 
  }>;
  
  /** Callback function called when registration is completed successfully */
  onRegistrationComplete: (propertyId: string) => void;
}

/**
 * PropertyRegistration Component
 * 
 * This component manages a three-step property registration process:
 * 1. Property Details Form - Collect property information
 * 2. Valuation Display - Show estimated value and minting potential
 * 3. Consent Signing - User signs consent message for verification
 * 
 * @component
 * @param {PropertyRegistrationProps} props - Component props
 * @returns {JSX.Element} The rendered PropertyRegistration component
 */
export const PropertyRegistration: React.FC<PropertyRegistrationProps> = ({
  uploadedDocuments,
  onRegistrationComplete
}) => {
  // Wallet hooks for user account and message signing
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Property details form state
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    address: '',
    city: '',
    state: '',
    pincode: '',
    propertyType: 'residential',
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    age: 0
  });

  // Multi-step process state management
  const [currentStep, setCurrentStep] = useState<'form' | 'valuation' | 'consent'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Valuation data state
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [mintCalculation, setMintCalculation] = useState<MintCalculation | null>(null);
  
  // Consent signing state
  const [consentSigned, setConsentSigned] = useState(false);
  const [signedMessage, setSignedMessage] = useState<string>('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  /**
   * Handles input changes for property details form
   * 
   * @param {keyof PropertyDetails} field - The field being updated
   * @param {string | number} value - The new value for the field
   */
  const handleInputChange = (field: keyof PropertyDetails, value: string | number) => {
    setPropertyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Initiates property valuation process
   * 
   * This function:
   * 1. Validates required fields
   * 2. Calls the property valuation service
   * 3. Calculates minting potential
   * 4. Transitions to valuation step
   * 
   * @async
   * @function handleGetValuation
   */
  const handleGetValuation = async () => {
    // Validate required fields
    if (!propertyDetails.address || !propertyDetails.area) {
      setError('Please fill in property address and area');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get property valuation from service
      const valuationResult = await propertyValuationService.getPropertyValuation(propertyDetails);
      
      // Calculate minting potential based on valuation
      const mintCalc = propertyValuationService.calculateMintingPotential(valuationResult.estimatedValue);
      
      // Update state and transition to valuation step
      setValuation(valuationResult);
      setMintCalculation(mintCalc);
      setCurrentStep('valuation');
    } catch (err) {
      setError('Failed to get property valuation');
      console.error('Valuation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user consent message signing
   * 
   * This function:
   * 1. Creates a detailed consent message
   * 2. Signs the message using the user's wallet
   * 3. Stores the signature for verification
   * 4. Transitions to consent step
   * 
   * @async
   * @function handleSignConsent
   */
  const handleSignConsent = async () => {
    if (!valuation || !mintCalculation || !address) return;

    // Create detailed consent message with all terms
    const consentMessage = `I, ${address}, hereby consent to:

1. Register my property at "${propertyDetails.address}" for tokenization
2. Property estimated value: ₹${valuation.estimatedValue.toLocaleString()}
3. Maximum HOMED tokens mintable: ₹${mintCalculation.maxMintAmount.toLocaleString()}
4. Collateral ratio requirement: ${(mintCalculation.requiredCollateralRatio * 100).toFixed(0)}%
5. Liquidation threshold: ${(mintCalculation.liquidationThreshold * 100).toFixed(0)}%

I understand the risks and agree to the terms.

Timestamp: ${new Date().toISOString()}
Property ID: property_${Date.now()}`;

    setIsLoading(true);
    try {
      // Sign the consent message using wallet
      const signature = await signMessageAsync({ message: consentMessage });
      
      // Store signature and update state
      setSignedMessage(signature);
      setConsentSigned(true);
      setCurrentStep('consent');
    } catch (err) {
      setError('Failed to sign consent message');
      console.error('Signing error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submits the complete property registration for verification
   * 
   * This function:
   * 1. Validates all required data is present
   * 2. Generates a unique property ID
   * 3. Submits to verification service
   * 4. Calls completion callback
   * 
   * @async
   * @function handleSubmitRegistration
   */
  const handleSubmitRegistration = async () => {
    if (!valuation || !consentSigned || uploadedDocuments.length === 0) return;

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      // Generate unique property ID
      const propertyId = `property_${Date.now()}`;
      
      // Extract IPFS hashes from uploaded documents
      const ipfsHashes = uploadedDocuments.map(doc => doc.ipfs_hash);

      // Submit for verification with all collected data
      await verificationService.submitForVerification(
        propertyId,
        ipfsHashes,
        {
          address: propertyDetails.address,
          estimatedValue: valuation.estimatedValue,
          ownerName: 'Property Owner' // In production, get from user profile
        }
      );

      // Notify parent component of successful registration
      onRegistrationComplete(propertyId);
    } catch (err) {
      setError('Failed to submit property registration');
      console.error('Registration submission error:', err);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  // Step 1: Property Details Form
  if (currentStep === 'form') {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Property Registration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Property Address - Full width field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Address *
            </label>
            <textarea
              value={propertyDetails.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter complete property address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          {/* City field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              type="text"
              value={propertyDetails.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Mumbai"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* State field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <input
              type="text"
              value={propertyDetails.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="Maharashtra"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Pincode field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
            <input
              type="text"
              value={propertyDetails.pincode}
              onChange={(e) => handleInputChange('pincode', e.target.value)}
              placeholder="400001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Property Type dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
            <select
              value={propertyDetails.propertyType}
              onChange={(e) => handleInputChange('propertyType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="plot">Plot/Land</option>
            </select>
          </div>

          {/* Area field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq ft) *</label>
            <input
              type="number"
              value={propertyDetails.area || ''}
              onChange={(e) => handleInputChange('area', parseInt(e.target.value) || 0)}
              placeholder="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Conditional fields for residential properties */}
          {propertyDetails.propertyType === 'residential' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  value={propertyDetails.bedrooms || ''}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                  placeholder="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  value={propertyDetails.bathrooms || ''}
                  onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
                  placeholder="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Property Age field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Age (years)</label>
            <input
              type="number"
              value={propertyDetails.age || ''}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
              placeholder="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="mt-6">
          <button
            onClick={handleGetValuation}
            disabled={isLoading || !propertyDetails.address || !propertyDetails.area}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              isLoading || !propertyDetails.address || !propertyDetails.area
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Getting Valuation...' : 'Get Property Valuation'}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Valuation Results Display
  if (currentStep === 'valuation' && valuation && mintCalculation) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Property Valuation Results</h3>
        
        {/* Valuation Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Property Value Card */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">Estimated Property Value</h4>
            <p className="text-2xl font-bold text-green-600">
              ₹{valuation.estimatedValue.toLocaleString()}
            </p>
            <p className="text-sm text-green-700">
              ₹{valuation.pricePerSqFt.toLocaleString()}/sq ft
            </p>
          </div>
          
          {/* Minting Potential Card */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Max HOMED Mintable</h4>
            <p className="text-2xl font-bold text-blue-600">
              ₹{mintCalculation.maxMintAmount.toLocaleString()}
            </p>
            <p className="text-sm text-blue-700">
              {(mintCalculation.maxLoanToValue * 100).toFixed(0)}% of property value
            </p>
          </div>
        </div>

        {/* Detailed Valuation Information */}
        <div className="space-y-4">
          {/* Valuation Range Indicator */}
          <div>
            <h4 className="font-medium mb-2">Valuation Range</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>₹{valuation.valuationRange.min.toLocaleString()}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-1/2"></div>
              </div>
              <span>₹{valuation.valuationRange.max.toLocaleString()}</span>
            </div>
          </div>

          {/* Key Terms and Conditions */}
          <div>
            <h4 className="font-medium mb-2">Key Terms</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Collateral Ratio:</span>
                <span className="ml-2 font-medium">{(mintCalculation.requiredCollateralRatio * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-gray-600">Liquidation Threshold:</span>
                <span className="ml-2 font-medium">{(mintCalculation.liquidationThreshold * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-gray-600">Estimated APR:</span>
                <span className="ml-2 font-medium">{(mintCalculation.estimatedAPR * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-600">Confidence:</span>
                <span className="ml-2 font-medium capitalize">{valuation.confidenceLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => setCurrentStep('form')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to Edit
          </button>
          <button
            onClick={handleSignConsent}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Preparing Consent...' : 'Sign Consent & Continue'}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Consent Confirmation and Final Submission
  if (currentStep === 'consent' && consentSigned) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Consent Signed Successfully</h3>
        
        {/* Consent Confirmation */}
        <div className="p-4 bg-green-50 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 font-medium">Consent message signed</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Signature: {signedMessage.slice(0, 20)}...{signedMessage.slice(-20)}
          </p>
        </div>

        {/* Registration Summary */}
        <div className="space-y-3 mb-6">
          <h4 className="font-medium">Ready to Submit:</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Property Address:</span>
              <span className="font-medium">{propertyDetails.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Value:</span>
              <span className="font-medium">₹{valuation?.estimatedValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Documents:</span>
              <span className="font-medium">{uploadedDocuments.length} files</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consent:</span>
              <span className="font-medium text-green-600">Signed ✓</span>
            </div>
          </div>
        </div>

        {/* Final Submit Button */}
        <button
          onClick={handleSubmitRegistration}
          disabled={isLoading || isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-medium ${
            isLoading || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting for Verification...' : 'Submit Property Registration'}
        </button>
      </div>
    );
  }

  // Fallback return (should not reach here in normal flow)
  return null;
};
