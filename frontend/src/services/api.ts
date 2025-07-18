// import axios from 'axios';
// import type { AxiosInstance } from 'axios';
// import type { ApiResponse, AuthResponse, Property, VerificationStatus, MintConsent, TokenBalance } from '../types';

// class ApiService {
//   private api: AxiosInstance;
//   private baseURL: string;

//   constructor() {
//     this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
//     this.api = axios.create({
//       baseURL: this.baseURL,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     // Add auth token to requests
//     this.api.interceptors.request.use((config) => {
//       const token = localStorage.getItem('access_token');
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     });

//     // Handle token expiration
//     this.api.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         if (error.response?.status === 401) {
//           localStorage.removeItem('access_token');
//           window.location.href = '/';
//         }
//         return Promise.reject(error);
//       }
//     );
//   }

//   // Authentication
//   async connectWallet(walletAddress: string, signature: string): Promise<AuthResponse> {
//     const response = await this.api.post<AuthResponse>('/connect-wallet', {
//       wallet_address: walletAddress,
//       signature: signature,
//     });
//     return response.data;
//   }

//   // Document Upload
//   async uploadDocuments(files: File[], propertyId?: string): Promise<ApiResponse<any>> {
//     const formData = new FormData();
//     files.forEach((file) => {
//       formData.append(`files`, file);
//     });
//     if (propertyId) {
//       formData.append('property_id', propertyId);
//     }

//     const response = await this.api.post<ApiResponse<any>>('/upload-docs', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     });
//     return response.data;
//   }

//   // Verification Status
//   async getVerificationStatus(userId: string): Promise<VerificationStatus> {
//     const response = await this.api.get<VerificationStatus>(`/verify-status/${userId}`);
//     return response.data;
//   }

//   // Property Valuation
//   async getPropertyEstimate(propertyId: string): Promise<ApiResponse<{ estimated_value: number }>> {
//     const response = await this.api.get<ApiResponse<{ estimated_value: number }>>(`/estimate/${propertyId}`);
//     return response.data;
//   }

//   // Mint Consent
//   async submitMintConsent(consent: MintConsent): Promise<ApiResponse<any>> {
//     const response = await this.api.post<ApiResponse<any>>('/mint-consent', consent);
//     return response.data;
//   }

//   // Liquidation
//   async triggerLiquidation(propertyId: string): Promise<ApiResponse<any>> {
//     const response = await this.api.post<ApiResponse<any>>('/liquidate', { property_id: propertyId });
//     return response.data;
//   }

//   // Properties
//   async getProperties(): Promise<Property[]> {
//     const response = await this.api.get<Property[]>('/properties');
//     return response.data;
//   }

//   async getProperty(propertyId: string): Promise<Property> {
//     const response = await this.api.get<Property>(`/properties/${propertyId}`);
//     return response.data;
//   }

//   // Token Balance
//   async getTokenBalance(): Promise<TokenBalance> {
//     const response = await this.api.get<TokenBalance>('/token-balance');
//     return response.data;
//   }
// }

// export const apiService = new ApiService();
// export default apiService;
