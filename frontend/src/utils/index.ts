/**
 * Format a wallet address for display
 */
export const formatAddress = (address: string, length = 4): string => {
  if (!address) return '';
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
};

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format a large number with K/M/B suffixes
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format a date for display
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a date with time
 */
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file type
 */
export const isValidFileType = (file: File, allowedTypes: Record<string, string[]>): boolean => {
  const fileType = file.type;
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  for (const [mimeType, extensions] of Object.entries(allowedTypes)) {
    if (mimeType === fileType || extensions.includes(fileExtension)) {
      return true;
    }
  }
  return false;
};

/**
 * Get verification status color
 */
export const getVerificationStatusColor = (status: 'pending' | 'verified' | 'rejected'): string => {
  switch (status) {
    case 'verified':
      return 'text-green-600 bg-green-100';
    case 'rejected':
      return 'text-red-600 bg-red-100';
    case 'pending':
    default:
      return 'text-yellow-600 bg-yellow-100';
  }
};

/**
 * Get health factor color
 */
export const getHealthFactorColor = (healthFactor: number): string => {
  if (healthFactor >= 1.5) return 'text-green-600';
  if (healthFactor >= 1.2) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Generate a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Delay function for async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

/**
 * Get IPFS URL from hash
 */
export const getIpfsUrl = (hash: string, gateway = 'https://ipfs.io/ipfs/'): string => {
  return `${gateway}${hash}`;
};
