// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { Tooltip } from "./tooltip";
import { cn } from "~/lib/utils";
import type { Resource } from "~/core/messages";
import { uploadToRAG } from "~/core/api/rag-upload";

interface FileUploadProps {
  className?: string;
  onFilesSelect: (files: File[], resources: Resource[]) => void;
  disabled?: boolean;
}

export function FileUpload({ className, onFilesSelect, disabled }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const uploadFile = async (file: File): Promise<Resource | null> => {
    try {
      const result = await uploadToRAG(file);
      
      if (result.success && result.resource) {
        return result.resource;
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      return null;
    }
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || isUploading) return;
      
      const fileArray = Array.from(files);
      const newFiles = [...selectedFiles, ...fileArray];
      setSelectedFiles(newFiles);
      setIsUploading(true);
      
      // Upload files and get resources
      const resources: Resource[] = [];
      
      for (const file of fileArray) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const resource = await uploadFile(file);
        
        if (resource) {
          resources.push(resource);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } else {
          // Create a local reference if upload fails
          resources.push({
            uri: `file://${file.name}`,
            title: file.name,
          });
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 indicates error
        }
      }
      
      setIsUploading(false);
      onFilesSelect(fileArray, resources);
    },
    [selectedFiles, onFilesSelect, isUploading]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
    },
    [selectedFiles]
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          isDragOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-white/20 hover:border-white/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          className="hidden"
          id="file-upload"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
        <label
          htmlFor="file-upload"
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 cursor-pointer",
            disabled && "cursor-not-allowed"
          )}
        >
          <Upload className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-400">
            Arraste arquivos aqui ou clique para selecionar
          </p>
        </label>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          {selectedFiles.map((file, index) => {
            const progress = uploadProgress[file.name];
            const isError = progress === -1;
            const isComplete = progress === 100;
            const isUploading = progress !== undefined && progress >= 0 && progress < 100;
            
            return (
              <div
                key={index}
                className="flex flex-col gap-1 rounded-lg bg-white/[0.05] p-3"
              >
                <div className="flex items-center gap-2">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                  ) : isComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : isError ? (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <File className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-300 flex-1">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {isUploading && (
                  <Progress value={progress} className="h-1" />
                )}
                {isError && (
                  <p className="text-xs text-red-400">Upload failed</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}