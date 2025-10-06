'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Upload, File, AlertCircle, CheckCircle, X, Shield, Lock } from 'lucide-react'

interface DocumentType {
  type: string
  maxSize: number
  maxSizeMB: number
  allowedExtensions: string[]
  mimeTypes: string[]
  virusScanRequired: boolean
  encryptionRequired: boolean
}

interface UploadedDocument {
  id: string
  filename: string
  fileSize: number
  documentType: string
  uploadDate: string
  expiryDate: string
  virusScanStatus: 'pending' | 'clean' | 'infected' | 'failed'
  isEncrypted: boolean
}

interface DocumentUploadProps {
  onUploadComplete?: (document: UploadedDocument) => void
  onUploadError?: (error: string) => void
  allowedTypes?: string[]
  maxFiles?: number
}

export default function DocumentUpload({
  onUploadComplete,
  onUploadError,
  allowedTypes,
  maxFiles = 5
}: DocumentUploadProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [selectedType, setSelectedType] = useState<string>('')
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load document type configurations on component mount
  React.useEffect(() => {
    loadDocumentTypes()
  }, [])

  const loadDocumentTypes = async () => {
    try {
      const response = await fetch('/api/v1/documents/upload')
      if (response.ok) {
        const data = await response.json()
        const types = data.data.documentTypes
        
        // Filter by allowed types if specified
        const filteredTypes = allowedTypes 
          ? types.filter((type: DocumentType) => allowedTypes.includes(type.type))
          : types
          
        setDocumentTypes(filteredTypes)
        
        // Set default type
        if (filteredTypes.length > 0) {
          setSelectedType(filteredTypes[0].type)
        }
      }
    } catch (error) {
      console.error('Failed to load document types:', error)
      setErrors(['Failed to load upload configuration'])
    }
  }

  const validateFile = (file: File): string | null => {
    const selectedConfig = documentTypes.find(type => type.type === selectedType)
    if (!selectedConfig) {
      return 'Please select a document type'
    }

    // Check file size
    if (file.size > selectedConfig.maxSize) {
      return `File size exceeds ${selectedConfig.maxSizeMB}MB limit`
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!selectedConfig.allowedExtensions.includes(fileExtension)) {
      return `File type not allowed. Allowed types: ${selectedConfig.allowedExtensions.join(', ')}`
    }

    // Check MIME type
    if (!selectedConfig.mimeTypes.includes(file.type)) {
      return `Invalid file format`
    }

    return null
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      throw new Error(validationError)
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', selectedType)
    formData.append('expiryDays', '365') // Default 1 year expiry

    const response = await fetch('/api/v1/documents/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }

    return response.json()
  }

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return

    // Check file limit
    if (uploadedFiles.length + files.length > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed`])
      return
    }

    setUploading(true)
    setErrors([])
    const newErrors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        setUploadProgress((i / files.length) * 100)
        
        const result = await uploadFile(file)
        
        if (result.success) {
          const uploadedDoc: UploadedDocument = result.data
          setUploadedFiles(prev => [...prev, uploadedDoc])
          onUploadComplete?.(uploadedDoc)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        newErrors.push(`${file.name}: ${errorMessage}`)
        onUploadError?.(errorMessage)
      }
    }

    setUploadProgress(100)
    setTimeout(() => {
      setUploading(false)
      setUploadProgress(0)
    }, 1000)

    if (newErrors.length > 0) {
      setErrors(newErrors)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [selectedType, documentTypes, uploadedFiles.length])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
    }
  }

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const clearErrors = () => {
    setErrors([])
  }

  const selectedConfig = documentTypes.find(type => type.type === selectedType)

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Documents
        </h3>
        <p className="text-sm text-gray-600">
          Securely upload your documents with virus scanning and encryption
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={uploading}
        >
          {documentTypes.map((type) => (
            <option key={type.type} value={type.type}>
              {type.type.charAt(0).toUpperCase() + type.type.slice(1)} 
              (Max: {type.maxSizeMB}MB)
            </option>
          ))}
        </select>
      </div>

      {/* Upload Configuration Info */}
      {selectedConfig && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <File className="w-4 h-4" />
            <span>
              Allowed: {selectedConfig.allowedExtensions.join(', ')} 
              (Max: {selectedConfig.maxSizeMB}MB)
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
            {selectedConfig.virusScanRequired && (
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Virus Scan</span>
              </div>
            )}
            {selectedConfig.encryptionRequired && (
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Encrypted</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={selectedConfig?.allowedExtensions.join(',') || '*'}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {dragActive ? 'Drop files here' : 'Upload Documents'}
        </p>
        <p className="text-sm text-gray-600">
          Drag and drop files here, or click to select files
        </p>
        
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-800">Upload Errors</span>
            </div>
            <button
              onClick={clearErrors}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="mt-2 text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index} className="list-disc list-inside">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.filename}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{file.documentType}</span>
                      {file.virusScanStatus === 'clean' && (
                        <>
                          <span>•</span>
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span>Virus Free</span>
                          </div>
                        </>
                      )}
                      {file.isEncrypted && (
                        <>
                          <span>•</span>
                          <div className="flex items-center text-blue-600">
                            <Lock className="w-3 h-3 mr-1" />
                            <span>Encrypted</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeUploadedFile(file.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}