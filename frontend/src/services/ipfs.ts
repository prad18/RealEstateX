import { PinataSDK } from 'pinata-web3'

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT || '',
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
})

export interface IPFSUploadResult {
  hash: string
  url: string
  size: number
  name: string
}

export class IPFSService {
  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      const upload = await pinata.upload.file(file)
      
      return {
        hash: upload.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`,
        size: upload.PinSize,
        name: file.name
      }
    } catch (error) {
      console.error('IPFS upload failed:', error)
      throw new Error('Failed to upload file to IPFS')
    }
  }

  /**
   * Upload multiple files to IPFS
   */
  async uploadFiles(files: File[]): Promise<IPFSUploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file))
    return Promise.all(uploadPromises)
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any, filename: string = 'data.json'): Promise<IPFSUploadResult> {
    try {
      const upload = await pinata.upload.json(data)
      
      return {
        hash: upload.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`,
        size: upload.PinSize,
        name: filename
      }
    } catch (error) {
      console.error('IPFS JSON upload failed:', error)
      throw new Error('Failed to upload JSON to IPFS')
    }
  }

  /**
   * Get file from IPFS
   */
  async getFile(hash: string): Promise<string> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`)
      return await response.text()
    } catch (error) {
      console.error('Failed to fetch from IPFS:', error)
      throw new Error('Failed to fetch file from IPFS')
    }
  }

  /**
   * Get JSON data from IPFS
   */
  async getJSON(hash: string): Promise<any> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`)
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch JSON from IPFS:', error)
      throw new Error('Failed to fetch JSON from IPFS')
    }
  }
}

export const ipfsService = new IPFSService()
