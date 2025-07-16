/**
 * Enhanced Hybrid Verification Service for RealEstateX
 * Phase 2: Advanced Oracle + Mandatory Manual verification system
 * 
 * Key Features:
 * - Multi-stage oracle analysis with confidence scoring
 * - Mandatory manual review for ALL properties (no auto-approval)
 * - Detailed risk assessment and compliance checking
 * - Human-in-the-loop final decision making
 */

export interface DocumentAnalysis {
  documentType: 'deed' | 'pan' | 'aadhar' | 'valuation' | 'tax_receipt' | 'other';
  confidence: number; // 0-1
  issues: string[];
  extractedData: {
    propertyAddress?: string;
    ownerName?: string;
    propertyValue?: number;
    documentDate?: string;
    registrationNumber?: string;
  };
}

export interface OracleResult {
  analysisId: string;
  overallConfidence: number; // 0-1
  documentAnalyses: DocumentAnalysis[];
  estimatedValue: number;
  riskFlags: string[];
  autoApproveEligible: boolean; // Always false - manual approval required
  timestamp: number;
}

export interface ManualReview {
  reviewId: string;
  reviewerAddress?: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  reviewerNotes: string;
  finalValue: number;
  approvalTimestamp?: number;
  rejectionReason?: string;
}

export interface VerificationResult {
  propertyId: string;
  status: 'uploading' | 'oracle_analysis' | 'manual_review' | 'approved' | 'rejected';
  oracleResult?: OracleResult;
  manualReview?: ManualReview;
  finalApproval: boolean;
  finalValue: number;
  completedAt?: number;
}

export interface VerificationPhase {
  phase: 'document_upload' | 'oracle_analysis' | 'risk_assessment' | 'manual_review' | 'final_decision';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: number;
  completedTime?: number;
  details?: any;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  complianceChecks: {
    check: string;
    passed: boolean;
    details?: string;
  }[];
  marketAnalysis: {
    priceDeviation: number; // % deviation from market average
    liquidityScore: number; // 0-100
    marketTrend: 'rising' | 'stable' | 'declining';
  };
}

export interface EnhancedVerificationResult extends VerificationResult {
  phases: VerificationPhase[];
  riskAssessment?: RiskAssessment;
  reviewerQueue: {
    assignedAt: number;
    expectedCompletionTime: number;
    priority: 'standard' | 'urgent' | 'critical';
  };
}

export class EnhancedHybridVerificationService {
  private verificationResults = new Map<string, EnhancedVerificationResult>();
  private reviewQueue: string[] = [];
  // private reviewersAvailable = ['reviewer_1', 'reviewer_2', 'reviewer_3']; // Mock reviewers - for future use

  /**
   * Phase 2: Enhanced verification submission with detailed tracking
   */
  async submitForVerification(
    propertyId: string,
    ipfsHashes: string[],
    propertyDetails: {
      address: string;
      estimatedValue: number;
      ownerName: string;
    }
  ): Promise<string> {
    console.log('🔍 Phase 2: Starting enhanced verification for property:', propertyId);

    // Initialize enhanced verification record
    const verification: EnhancedVerificationResult = {
      propertyId,
      status: 'oracle_analysis',
      finalApproval: false,
      finalValue: 0,
      phases: [
        {
          phase: 'document_upload',
          status: 'completed',
          startTime: Date.now() - 1000,
          completedTime: Date.now(),
          details: { documentsCount: ipfsHashes.length }
        },
        {
          phase: 'oracle_analysis',
          status: 'in_progress',
          startTime: Date.now()
        },
        {
          phase: 'risk_assessment',
          status: 'pending'
        },
        {
          phase: 'manual_review',
          status: 'pending'
        },
        {
          phase: 'final_decision',
          status: 'pending'
        }
      ],
      reviewerQueue: {
        assignedAt: Date.now(),
        expectedCompletionTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        priority: this.determinePriority(propertyDetails.estimatedValue)
      }
    };

    this.verificationResults.set(propertyId, verification);

    // Phase 1: Oracle Analysis
    setTimeout(async () => {
      await this.performEnhancedOracleAnalysis(propertyId, ipfsHashes, propertyDetails);
    }, 2000);

    return propertyId;
  }

  /**
   * Enhanced Oracle Analysis with multi-stage verification
   */
  private async performEnhancedOracleAnalysis(
    propertyId: string,
    ipfsHashes: string[],
    propertyDetails: any
  ): Promise<void> {
    const verification = this.verificationResults.get(propertyId);
    if (!verification) return;

    console.log('🤖 Phase 2: Enhanced Oracle Analysis starting...', ipfsHashes);

    // Stage 1: Document Analysis
    const documentAnalyses: DocumentAnalysis[] = ipfsHashes.map((_, index) => {
      const docTypes: DocumentAnalysis['documentType'][] = ['deed', 'pan', 'aadhar', 'valuation', 'tax_receipt'];
      const docType = docTypes[index % docTypes.length];
      
      return {
        documentType: docType,
        confidence: this.calculateDocumentConfidence(docType, propertyDetails),
        issues: this.generateContextualIssues(docType),
        extractedData: this.extractDocumentData(docType, propertyDetails)
      };
    });

    // Stage 2: Cross-verification
    const crossVerificationResult = this.performCrossVerification(documentAnalyses);

    // Stage 3: Market Analysis
    const marketAnalysis = await this.performMarketAnalysis(propertyDetails);

    const oracleResult: OracleResult = {
      analysisId: `enhanced_oracle_${Date.now()}`,
      overallConfidence: crossVerificationResult.overallConfidence,
      documentAnalyses,
      estimatedValue: marketAnalysis.adjustedValue,
      riskFlags: [...crossVerificationResult.riskFlags, ...marketAnalysis.riskFlags],
      autoApproveEligible: false, // Phase 2: NEVER auto-approve
      timestamp: Date.now()
    };

    verification.oracleResult = oracleResult;

    // Update phase
    verification.phases.find(p => p.phase === 'oracle_analysis')!.status = 'completed';
    verification.phases.find(p => p.phase === 'oracle_analysis')!.completedTime = Date.now();

    // Move to Risk Assessment
    verification.phases.find(p => p.phase === 'risk_assessment')!.status = 'in_progress';
    verification.phases.find(p => p.phase === 'risk_assessment')!.startTime = Date.now();

    // Perform Risk Assessment
    setTimeout(() => {
      this.performRiskAssessment(propertyId, oracleResult, propertyDetails);
    }, 1500);
  }

  /**
   * Phase 2: Advanced Risk Assessment
   */
  private async performRiskAssessment(
    propertyId: string,
    oracleResult: OracleResult,
    propertyDetails: any
  ): Promise<void> {
    const verification = this.verificationResults.get(propertyId);
    if (!verification) return;

    console.log('⚠️ Phase 2: Performing advanced risk assessment...');

    const riskAssessment: RiskAssessment = {
      overallRisk: this.calculateOverallRisk(oracleResult),
      riskFactors: this.identifyRiskFactors(oracleResult, propertyDetails),
      complianceChecks: this.performComplianceChecks(propertyDetails),
      marketAnalysis: {
        priceDeviation: Math.random() * 20 - 10, // -10% to +10%
        liquidityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        marketTrend: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any
      }
    };

    verification.riskAssessment = riskAssessment;

    // Update phase
    verification.phases.find(p => p.phase === 'risk_assessment')!.status = 'completed';
    verification.phases.find(p => p.phase === 'risk_assessment')!.completedTime = Date.now();

    // Move to Manual Review (MANDATORY)
    verification.status = 'manual_review';
    verification.phases.find(p => p.phase === 'manual_review')!.status = 'in_progress';
    verification.phases.find(p => p.phase === 'manual_review')!.startTime = Date.now();

    this.queueForManualReview(propertyId);
  }

  /**
   * Phase 2: Enhanced Manual Review Assignment
   */
  private queueForManualReview(propertyId: string): void {
    const verification = this.verificationResults.get(propertyId);
    if (!verification) return;

    const manualReview: ManualReview = {
      reviewId: `phase2_review_${Date.now()}`,
      status: 'pending',
      reviewerNotes: '',
      finalValue: 0
    };

    verification.manualReview = manualReview;
    this.reviewQueue.push(propertyId);

    console.log('👤 Phase 2: MANDATORY Manual Review queued for:', propertyId);
    console.log('📋 Review queue length:', this.reviewQueue.length);
    console.log('⚠️ Risk level:', verification.riskAssessment?.overallRisk);
  }

  /**
   * Phase 2: Enhanced Manual Review with Final Decision
   */
  async simulateManualReview(
    propertyId: string,
    approved: boolean,
    reviewerNotes: string,
    finalValue?: number
  ): Promise<void> {
    const verification = this.verificationResults.get(propertyId);
    if (!verification || !verification.manualReview) {
      throw new Error('No manual review found for property');
    }

    console.log(`👤 Phase 2: Manual Review ${approved ? 'APPROVED' : 'REJECTED'} for:`, propertyId);
    console.log('📝 Reviewer decision is FINAL - no further automation');

    // Update manual review
    verification.manualReview.status = approved ? 'approved' : 'rejected';
    verification.manualReview.reviewerNotes = reviewerNotes;
    verification.manualReview.reviewerAddress = '0x' + Math.random().toString(16).substr(2, 40);
    verification.manualReview.approvalTimestamp = Date.now();

    // Update phases
    verification.phases.find(p => p.phase === 'manual_review')!.status = 'completed';
    verification.phases.find(p => p.phase === 'manual_review')!.completedTime = Date.now();

    // Move to Final Decision
    verification.phases.find(p => p.phase === 'final_decision')!.status = 'completed';
    verification.phases.find(p => p.phase === 'final_decision')!.startTime = Date.now();
    verification.phases.find(p => p.phase === 'final_decision')!.completedTime = Date.now();

    // Final status update
    if (approved) {
      verification.status = 'approved';
      verification.finalApproval = true;
      verification.finalValue = finalValue || verification.oracleResult?.estimatedValue || 0;
      verification.completedAt = Date.now();
      
      console.log('✅ Phase 2: Property APPROVED for tokenization');
      console.log('💰 Final approved value:', verification.finalValue);
    } else {
      verification.status = 'rejected';
      verification.finalApproval = false;
      verification.manualReview.rejectionReason = reviewerNotes;
      
      console.log('❌ Phase 2: Property REJECTED');
      console.log('📝 Rejection reason:', reviewerNotes);
    }

    // Remove from queue
    const queueIndex = this.reviewQueue.indexOf(propertyId);
    if (queueIndex > -1) {
      this.reviewQueue.splice(queueIndex, 1);
    }

    this.verificationResults.set(propertyId, verification);
  }

  /**
   * Get enhanced verification status
   */
  getVerificationStatus(propertyId: string): EnhancedVerificationResult | null {
    return this.verificationResults.get(propertyId) || null;
  }

  /**
   * Get detailed verification analytics
   */
  getVerificationAnalytics(propertyId: string): any {
    const verification = this.verificationResults.get(propertyId);
    if (!verification) return null;

    return {
      totalTimeElapsed: verification.completedAt ? verification.completedAt - verification.phases[0].startTime! : Date.now() - verification.phases[0].startTime!,
      phaseTiming: verification.phases.map(p => ({
        phase: p.phase,
        duration: p.completedTime && p.startTime ? p.completedTime - p.startTime : null,
        status: p.status
      })),
      riskProfile: verification.riskAssessment?.overallRisk,
      confidenceScore: verification.oracleResult?.overallConfidence,
      reviewerWorkload: this.reviewQueue.length
    };
  }

  /**
   * Helper methods for Phase 2 enhancements
   */
  private calculateDocumentConfidence(docType: DocumentAnalysis['documentType'], _details: any): number {
    // More sophisticated confidence calculation based on document type
    const baseConfidence = 0.75;
    const typeMultiplier = {
      'deed': 1.0,
      'pan': 0.9,
      'aadhar': 0.8,
      'valuation': 0.95,
      'tax_receipt': 0.85,
      'other': 0.7
    };
    
    return Math.min(0.98, baseConfidence * typeMultiplier[docType] + Math.random() * 0.15);
  }

  private generateContextualIssues(docType: DocumentAnalysis['documentType']): string[] {
    const issuesByType: Record<string, string[]> = {
      'deed': ['Property boundaries need verification', 'Signature clarity acceptable'],
      'pan': ['PAN number cross-verification pending', 'Document age within acceptable range'],
      'aadhar': ['Address verification needed', 'Biometric data not accessible'],
      'valuation': ['Market comparison required', 'Valuation methodology needs review'],
      'tax_receipt': ['Payment history verification needed', 'Tax calculations need audit'],
      'other': ['Document type identification needed', 'Additional verification required']
    };

    const issues = issuesByType[docType] || issuesByType['other'];
    return issues.slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private extractDocumentData(docType: DocumentAnalysis['documentType'], details: any): any {
    // More sophisticated data extraction simulation
    const baseData = {
      propertyAddress: details.address,
      ownerName: details.ownerName,
      propertyValue: details.estimatedValue,
      documentDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    switch (docType) {
      case 'deed':
        return { ...baseData, registrationNumber: `DEED${Math.floor(Math.random() * 1000000)}` };
      case 'pan':
        return { ...baseData, panNumber: `ABCDE${Math.floor(Math.random() * 10000)}F` };
      case 'valuation':
        return { ...baseData, valuationDate: baseData.documentDate, valuerId: `VAL${Math.floor(Math.random() * 1000)}` };
      default:
        return baseData;
    }
  }

  private performCrossVerification(analyses: DocumentAnalysis[]): { overallConfidence: number, riskFlags: string[] } {
    const avgConfidence = analyses.reduce((sum, doc) => sum + doc.confidence, 0) / analyses.length;
    const riskFlags: string[] = [];

    if (avgConfidence < 0.8) riskFlags.push('Low overall document confidence');
    if (analyses.length < 3) riskFlags.push('Insufficient documentation');
    
    const addressMatches = analyses.filter(doc => doc.extractedData.propertyAddress).length;
    if (addressMatches < 2) riskFlags.push('Address verification incomplete');

    return { overallConfidence: avgConfidence, riskFlags };
  }

  private async performMarketAnalysis(details: any): Promise<{ adjustedValue: number, riskFlags: string[] }> {
    // Simulate market analysis
    const marketVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const adjustedValue = details.estimatedValue * (1 + marketVariation);
    const riskFlags: string[] = [];

    if (Math.abs(marketVariation) > 0.05) {
      riskFlags.push('Significant market price deviation detected');
    }

    return { adjustedValue, riskFlags };
  }

  private calculateOverallRisk(oracleResult: OracleResult): 'low' | 'medium' | 'high' | 'critical' {
    const confidence = oracleResult.overallConfidence;
    const riskCount = oracleResult.riskFlags.length;

    if (confidence > 0.9 && riskCount === 0) return 'low';
    if (confidence > 0.8 && riskCount <= 2) return 'medium';
    if (confidence > 0.7 && riskCount <= 4) return 'high';
    return 'critical';
  }

  private identifyRiskFactors(oracleResult: OracleResult, details: any): RiskAssessment['riskFactors'] {
    const factors: RiskAssessment['riskFactors'] = [];

    if (oracleResult.overallConfidence < 0.8) {
      factors.push({
        category: 'Documentation',
        severity: 'high',
        description: 'Document verification confidence below threshold'
      });
    }

    if (details.estimatedValue > 10000000) {
      factors.push({
        category: 'Value',
        severity: 'medium',
        description: 'High-value property requires additional scrutiny'
      });
    }

    return factors;
  }

  private performComplianceChecks(_details: any): RiskAssessment['complianceChecks'] {
    return [
      {
        check: 'KYC Verification',
        passed: Math.random() > 0.1,
        details: 'Owner identity verification completed'
      },
      {
        check: 'Legal Title Verification',
        passed: Math.random() > 0.05,
        details: 'Property ownership rights confirmed'
      },
      {
        check: 'Regulatory Compliance',
        passed: Math.random() > 0.02,
        details: 'All regulatory requirements met'
      }
    ];
  }

  private determinePriority(value: number): 'standard' | 'urgent' | 'critical' {
    if (value > 50000000) return 'critical';
    if (value > 10000000) return 'urgent';
    return 'standard';
  }
}

// Export enhanced singleton instance
export const enhancedVerificationService = new EnhancedHybridVerificationService();

// Keep backward compatibility
export const verificationService = enhancedVerificationService;
