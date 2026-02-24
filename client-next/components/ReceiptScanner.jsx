'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Loader2, Trash2 } from 'lucide-react';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

export function ReceiptScanner({ groupId, onTripsExtracted }) {
  const { isMobile } = useWindowDimensions();
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Process image
      await processReceiptImage(file);
    }
  };

  const processReceiptImage = async (file) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await apiClient.post('/receipt-scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.data) {
        const trips = response.data.data.map((trip, index) => ({
          id: index + 1,
          group_id: groupId,
          ...trip,
          mem_id: '[]',
        }));
        
        setTableData(trips);
        toast.success('Receipt scanned successfully!');
        
        if (onTripsExtracted) {
          onTripsExtracted(trips);
        }
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setTableData([]);
    if (cameraInputRef.current) cameraInputRef.current.value = null;
    if (uploadInputRef.current) uploadInputRef.current.value = null;
  };

  const handleCameraClick = () => {
    if (isMobile && cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Action Buttons */}
      {!imagePreview && (
        <div className="grid grid-cols-2 gap-4">
          {isMobile && (
            <Button
              onClick={handleCameraClick}
              variant="outline"
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          )}
          <Button
            onClick={handleUploadClick}
            variant="outline"
            className={cn(!isMobile && 'col-span-2')}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={imagePreview}
              alt="Receipt preview"
              className="w-full h-auto max-h-96 object-contain"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Processing receipt...</span>
        </div>
      )}

      {/* Extracted Data Preview */}
      {tableData.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Extracted Trips ({tableData.length})</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTableData([])}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {tableData.map((trip, index) => (
                <div
                  key={trip.id}
                  className="p-3 border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <div className="font-medium">{trip.trp_name || `Trip ${index + 1}`}</div>
                  <div className="text-sm text-muted-foreground">
                    {trip.spend ? `${trip.spend} THB` : 'No amount'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
