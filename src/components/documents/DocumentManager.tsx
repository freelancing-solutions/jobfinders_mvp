'use client'

import React, { useState, useEffect } from 'react'
import { 
  File, 
  Download, 
  Share2, 
  Trash2, 
  Eye, 
  Calendar, 
  Shield, 
  Lock,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  X
} from 'lucide-react'

interface Document {
  id: string
  filename: string
  documentType: string
  fileSize: number
  uploadDate: string
  expiryDate: string
  isExpired: boolean
  virusScanStatus: 'pending' | 'clean' | 'infected' | 'failed'
  isEncrypted: boolean
  downloadCount: number
}

interface SignedUrlData {
  signedUrl: string
  token: string
  expiryDate: string
  maxDownloads: number
  allowedIpAddresses?: string[]
  documentInfo: {
    filename: string
    fileSize: number
    documentType: string
  }
}

interface DocumentManagerProps {
  onDocumentDeleted?: (documentId: string) => void
  onError?: (error: string) => void
}

export default function DocumentManager({
  onDocumentDeleted,
  onError
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [includeExpired, setIncludeExpired] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [shareConfig, setShareConfig] = useState({
    expiryMinutes: 60,
    maxDownloads: 5,
    allowedIpAddresses: ''
  })
  const [generatingUrl, setGeneratingUrl] = useState(false)
  const [sharedUrl, setSharedUrl] = useState<SignedUrlData | null>(null)

  const documentTypes = ['all', 'cv', 'cover-letter', 'portfolio', 'certificate']

  useEffect(() => {
    loadDocuments()
  }, [selectedType, includeExpired, page])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        includeExpired: includeExpired.toString()
      })

      if (selectedType !== 'all') {
        params.append('documentType', selectedType)
      }

      const response = await fetch(`/api/v1/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.data.documents)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        throw new Error('Failed to load documents')
      }
    } catch (error) {
      console.error('Load documents error:', error)
      onError?.('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/v1/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentId })
      })

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        onDocumentDeleted?.(documentId)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Delete document error:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to delete document')
    }
  }

  const generateSignedUrl = async () => {
    if (!selectedDocument) return

    try {
      setGeneratingUrl(true)
      
      const allowedIps = shareConfig.allowedIpAddresses
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0)

      const response = await fetch('/api/v1/documents/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          expiryMinutes: shareConfig.expiryMinutes,
          maxDownloads: shareConfig.maxDownloads,
          allowedIpAddresses: allowedIps.length > 0 ? allowedIps : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSharedUrl(data.data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate signed URL')
      }
    } catch (error) {
      console.error('Generate signed URL error:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to generate sharing link')
    } finally {
      setGeneratingUrl(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link')
    })
  }

  const openShareModal = (document: Document) => {
    setSelectedDocument(document)
    setShareModalOpen(true)
    setSharedUrl(null)
  }

  const closeShareModal = () => {
    setShareModalOpen(false)
    setSelectedDocument(null)
    setSharedUrl(null)
    setShareConfig({
      expiryMinutes: 60,
      maxDownloads: 5,
      allowedIpAddresses: ''
    })
  }

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getVirusScanBadge = (status: string) => {
    switch (status) {
      case 'clean':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Shield className="w-3 h-3 mr-1" />
            Clean
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Scanning
          </span>
        )
      case 'infected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Infected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </span>
        )
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Document Manager
        </h3>
        <p className="text-sm text-gray-600">
          Manage your uploaded documents, generate sharing links, and track access
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {documentTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeExpired}
            onChange={(e) => setIncludeExpired(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Include expired</span>
        </label>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading documents...</span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">No documents found</p>
          <p className="text-sm text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className={`p-4 border rounded-lg ${
                document.isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <File className="w-8 h-8 text-gray-500" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {document.filename}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>•</span>
                      <span>{document.documentType}</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(document.uploadDate)}</span>
                      {document.downloadCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{document.downloadCount} downloads</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {getVirusScanBadge(document.virusScanStatus)}
                      {document.isEncrypted && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Lock className="w-3 h-3 mr-1" />
                          Encrypted
                        </span>
                      )}
                      {document.isExpired && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Calendar className="w-3 h-3 mr-1" />
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openShareModal(document)}
                    disabled={document.isExpired || document.virusScanStatus !== 'clean'}
                    className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generate sharing link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteDocument(document.id)}
                    className="p-2 text-gray-500 hover:text-red-600"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {document.isExpired && (
                <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                  This document expired on {formatDate(document.expiryDate)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Share Document
              </h3>
              <button
                onClick={closeShareModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Generate a secure sharing link for:
              </p>
              <p className="font-medium text-gray-900">
                {selectedDocument.filename}
              </p>
            </div>

            {!sharedUrl ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link expires in (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    value={shareConfig.expiryMinutes}
                    onChange={(e) => setShareConfig(prev => ({
                      ...prev,
                      expiryMinutes: parseInt(e.target.value) || 60
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum downloads
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={shareConfig.maxDownloads}
                    onChange={(e) => setShareConfig(prev => ({
                      ...prev,
                      maxDownloads: parseInt(e.target.value) || 5
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allowed IP addresses (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.1.1, 10.0.0.1"
                    value={shareConfig.allowedIpAddresses}
                    onChange={(e) => setShareConfig(prev => ({
                      ...prev,
                      allowedIpAddresses: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated IP addresses. Leave empty to allow any IP.
                  </p>
                </div>

                <button
                  onClick={generateSignedUrl}
                  disabled={generatingUrl}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingUrl ? 'Generating...' : 'Generate Sharing Link'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Sharing link generated successfully!
                  </p>
                  <div className="text-xs text-green-700">
                    <p>Expires: {formatDate(sharedUrl.expiryDate)}</p>
                    <p>Max downloads: {sharedUrl.maxDownloads}</p>
                    {sharedUrl.allowedIpAddresses && (
                      <p>Restricted to: {sharedUrl.allowedIpAddresses.join(', ')}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sharing Link
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={sharedUrl.signedUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(sharedUrl.signedUrl)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}