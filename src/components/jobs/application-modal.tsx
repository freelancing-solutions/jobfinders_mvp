'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { ApplicationForm } from './application-form'
import { CheckCircle, X } from 'lucide-react'

interface ApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  companyName: string
}

export function ApplicationModal({ 
  isOpen, 
  onClose, 
  jobId, 
  jobTitle, 
  companyName 
}: ApplicationModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)

  const handleApplicationSuccess = () => {
    setShowSuccess(true)
  }

  const handleClose = () => {
    setShowSuccess(false)
    onClose()
  }

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              Application Submitted!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your application for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> has been successfully submitted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your application will be reviewed by the hiring team</li>
                <li>• You'll receive an email confirmation shortly</li>
                <li>• Shortlisted candidates will be contacted for interviews</li>
                <li>• You can track your application status in your profile</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  handleClose()
                  // Navigate to applications page or dashboard
                  window.location.href = '/jobs'
                }}
                className="flex-1"
              >
                Browse More Jobs
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Job Application</DialogTitle>
          <DialogDescription>
            {jobTitle} • {companyName}
          </DialogDescription>
        </DialogHeader>
        
        <ApplicationForm
          jobId={jobId}
          jobTitle={jobTitle}
          companyName={companyName}
          onSuccess={handleApplicationSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}