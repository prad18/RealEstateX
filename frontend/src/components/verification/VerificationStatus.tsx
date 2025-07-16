import React, { useState, useEffect } from 'react';
import { verificationService, type VerificationResult, type EnhancedVerificationResult } from '@/services/verificationService';

interface VerificationStatusProps {
  propertyId: string;
  onVerificationUpdate?: (result: VerificationResult) => void;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  propertyId,
  onVerificationUpdate
}) => {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Demo controls (for testing)
  const [showDemoControls, setShowDemoControls] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchVerificationStatus();

    // Set up polling for updates
    const interval = setInterval(fetchVerificationStatus, 5000); // Poll every 5 seconds
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (interval) clearInterval(interval);
    };
  }, [propertyId, refreshInterval]);

  const fetchVerificationStatus = () => {
    const result = verificationService.getVerificationStatus(propertyId);
    if (result) {
      setVerificationResult(result);
      if (onVerificationUpdate) {
        onVerificationUpdate(result);
      }
    }
  };

  // Demo function to simulate manual review completion
  const handleDemoReview = async (approved: boolean) => {
    if (!verificationResult) return;

    const reviewNotes = approved 
      ? 'All documents verified successfully. Property details confirmed.'
      : 'Documents require additional verification. Please resubmit with clearer copies.';

    const finalValue = approved ? verificationResult.oracleResult?.estimatedValue || 0 : 0;

    await verificationService.simulateManualReview(
      propertyId,
      approved,
      reviewNotes,
      finalValue
    );

    fetchVerificationStatus();
  };

  if (!verificationResult) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'oracle_analysis':
        return (
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'manual_review':
        return (
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'approved':
        return (
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'rejected':
        return (
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (verificationResult.status) {
      case 'oracle_analysis':
        return 'AI Oracle is analyzing your documents...';
      case 'manual_review':
        return 'Documents are being reviewed by our verification team';
      case 'approved':
        return 'Property verification completed successfully!';
      case 'rejected':
        return 'Property verification was rejected';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Verification Status</h3>
        {verificationResult.status === 'manual_review' && (
          <button
            onClick={() => setShowDemoControls(!showDemoControls)}
            className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
          >
            Demo Controls
          </button>
        )}
      </div>

      {/* Status Overview */}
      <div className="flex items-center space-x-3 mb-6">
        {getStatusIcon(verificationResult.status)}
        <div>
          <p className="font-medium capitalize">{verificationResult.status.replace('_', ' ')}</p>
          <p className="text-sm text-gray-600">{getStatusMessage()}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="space-y-4 mb-6">
        {/* Oracle Analysis */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            verificationResult.status === 'oracle_analysis' ? 'bg-blue-100' :
            ['manual_review', 'approved', 'rejected'].includes(verificationResult.status) ? 'bg-green-100' :
            'bg-gray-100'
          }`}>
            {verificationResult.status === 'oracle_analysis' ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : ['manual_review', 'approved', 'rejected'].includes(verificationResult.status) ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-gray-500 text-sm font-bold">1</span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">Oracle Analysis</p>
            <p className="text-sm text-gray-600">AI-powered document verification</p>
            {verificationResult.oracleResult && (
              <p className="text-xs text-green-600">
                Confidence: {(verificationResult.oracleResult.overallConfidence * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {/* Manual Review */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            verificationResult.status === 'manual_review' ? 'bg-yellow-100' :
            ['approved', 'rejected'].includes(verificationResult.status) ? 'bg-green-100' :
            'bg-gray-100'
          }`}>
            {verificationResult.status === 'manual_review' ? (
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : ['approved', 'rejected'].includes(verificationResult.status) ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-gray-500 text-sm font-bold">2</span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">Manual Review</p>
            <p className="text-sm text-gray-600">Human expert verification (Required)</p>
            {verificationResult.manualReview && (
              <p className="text-xs text-blue-600">
                Status: {verificationResult.manualReview.status}
              </p>
            )}
          </div>
        </div>

        {/* Final Decision */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            verificationResult.status === 'approved' ? 'bg-green-100' :
            verificationResult.status === 'rejected' ? 'bg-red-100' :
            'bg-gray-100'
          }`}>
            {verificationResult.status === 'approved' ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : verificationResult.status === 'rejected' ? (
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <span className="text-gray-500 text-sm font-bold">3</span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">Final Decision</p>
            <p className="text-sm text-gray-600">Property ready for tokenization</p>
          </div>
        </div>
      </div>

      {/* Oracle Results */}
      {verificationResult.oracleResult && (
        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium mb-2">Oracle Analysis Results</h4>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Confidence:</span>
              <span className="font-medium">
                {(verificationResult.oracleResult.overallConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimated Value:</span>
              <span className="font-medium">
                ₹{verificationResult.oracleResult.estimatedValue.toLocaleString()}
              </span>
            </div>
            {verificationResult.oracleResult.riskFlags.length > 0 && (
              <div className="text-sm">
                <span>Risk Flags:</span>
                <ul className="text-yellow-600 text-xs mt-1 space-y-1">
                  {verificationResult.oracleResult.riskFlags.map((flag, index) => (
                    <li key={index}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Review Results */}
      {verificationResult.manualReview && ['approved', 'rejected'].includes(verificationResult.status) && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Manual Review Results</h4>
          <div className={`rounded-lg p-3 ${
            verificationResult.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="flex justify-between text-sm mb-2">
              <span>Reviewer Decision:</span>
              <span className={`font-medium ${
                verificationResult.status === 'approved' ? 'text-green-600' : 'text-red-600'
              }`}>
                {verificationResult.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <strong>Notes:</strong> {verificationResult.manualReview.reviewerNotes}
            </div>
            {verificationResult.status === 'approved' && (
              <div className="flex justify-between text-sm mt-2">
                <span>Final Property Value:</span>
                <span className="font-medium text-green-600">
                  ₹{verificationResult.finalValue.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Phase 2 Progress Display */}
      {verificationResult && 'phases' in verificationResult && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Phase 2: Enhanced Verification Process</h4>
          <div className="space-y-3">
            {(verificationResult as EnhancedVerificationResult).phases.map((phase, index) => (
              <div key={phase.phase} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  phase.status === 'completed' ? 'bg-green-500 text-white' :
                  phase.status === 'in_progress' ? 'bg-blue-500 text-white' :
                  phase.status === 'failed' ? 'bg-red-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {phase.status === 'completed' ? '✓' : 
                   phase.status === 'in_progress' ? '⏳' : 
                   phase.status === 'failed' ? '✗' : 
                   index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {phase.phase.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                      phase.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      phase.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {phase.status}
                    </span>
                  </div>
                  {phase.completedTime && phase.startTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      Completed in {Math.round((phase.completedTime - phase.startTime) / 1000)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Assessment Display */}
      {verificationResult && 'riskAssessment' in verificationResult && (verificationResult as EnhancedVerificationResult).riskAssessment && (
        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium mb-3">Phase 2: Risk Assessment</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Risk Level:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                (verificationResult as EnhancedVerificationResult).riskAssessment!.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
                (verificationResult as EnhancedVerificationResult).riskAssessment!.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                (verificationResult as EnhancedVerificationResult).riskAssessment!.overallRisk === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {(verificationResult as EnhancedVerificationResult).riskAssessment!.overallRisk.toUpperCase()}
              </span>
            </div>
            
            {(verificationResult as EnhancedVerificationResult).riskAssessment!.riskFactors.length > 0 && (
              <div>
                <span className="text-sm font-medium">Risk Factors:</span>
                <ul className="mt-1 space-y-1">
                  {(verificationResult as EnhancedVerificationResult).riskAssessment!.riskFactors.map((factor, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 mt-1 ${
                        factor.severity === 'high' ? 'bg-red-400' :
                        factor.severity === 'medium' ? 'bg-yellow-400' :
                        'bg-green-400'
                      }`}></span>
                      <span>
                        <strong>{factor.category}:</strong> {factor.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <span className="text-xs text-gray-600">Market Analysis:</span>
                <div className="text-sm">
                  Price Deviation: {(verificationResult as EnhancedVerificationResult).riskAssessment!.marketAnalysis.priceDeviation > 0 ? '+' : ''}
                  {(verificationResult as EnhancedVerificationResult).riskAssessment!.marketAnalysis.priceDeviation.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Liquidity Score:</span>
                <div className="text-sm font-medium">
                  {(verificationResult as EnhancedVerificationResult).riskAssessment!.marketAnalysis.liquidityScore}/100
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-600">Compliance Checks:</span>
              <div className="mt-1 space-y-1">
                {(verificationResult as EnhancedVerificationResult).riskAssessment!.complianceChecks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span>{check.check}</span>
                    <span className={`px-2 py-0.5 rounded ${
                      check.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Queue Info */}
      {verificationResult && 'reviewerQueue' in verificationResult && verificationResult.status === 'manual_review' && (
        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium mb-2">Phase 2: Manual Review Queue</h4>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span>Priority Level:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                (verificationResult as EnhancedVerificationResult).reviewerQueue.priority === 'critical' ? 'bg-red-100 text-red-800' :
                (verificationResult as EnhancedVerificationResult).reviewerQueue.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {(verificationResult as EnhancedVerificationResult).reviewerQueue.priority.toUpperCase()}
              </span>
            </div>
            <div className="text-sm mt-2">
              <span className="text-gray-600">Expected completion:</span>
              <span className="ml-1 font-medium">
                {new Date((verificationResult as EnhancedVerificationResult).reviewerQueue.expectedCompletionTime).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2 Manual Review Notice */}
      {verificationResult.status === 'manual_review' && (
        <div className="border-t pt-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
            <h4 className="font-medium text-blue-900 mb-2">Phase 2: Manual Review Required</h4>
            <p className="text-sm text-blue-800">
              🔒 <strong>All properties require manual approval</strong> - No automated decisions are made.
              Our expert reviewers will carefully examine all documentation and risk factors before making the final decision.
            </p>
            <div className="mt-3 text-xs text-blue-700">
              <p>✓ Oracle analysis completed with confidence score</p>
              <p>✓ Risk assessment performed</p>
              <p>⏳ Awaiting human expert review (this step is mandatory)</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Demo Controls */}
      {showDemoControls && verificationResult.status === 'manual_review' && (
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-3 text-gray-600">Phase 2 Demo: Simulate Manual Review Decision</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="text-xs text-gray-600">
              <p>👤 <strong>Manual Review Stage:</strong> Human expert making final decision</p>
              <p>🔍 All oracle analysis and risk assessment data has been reviewed</p>
              <p>⚖️ The reviewer's decision is <strong>FINAL</strong> - no further automation</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDemoReview(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
              >
                <span>✅</span>
                <span>APPROVE</span>
              </button>
              <button
                onClick={() => handleDemoReview(false)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-1"
              >
                <span>❌</span>
                <span>REJECT</span>
              </button>
            </div>
            <div className="text-xs text-gray-500 italic">
              Note: In production, this would be done by certified property verification experts
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
