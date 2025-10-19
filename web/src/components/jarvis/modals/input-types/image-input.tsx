"use client";

import React, { type ChangeEvent } from "react";
import { UploadCloud } from "lucide-react";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import {
  getFileAcceptAttribute,
  getMaxFileSize,
} from "~/lib/input-modal-utils";

interface ImageInputProps {
  type: string;
  file: File | null;
  onChange: (file: File | null) => void;
  onFileNameChange?: (fileName: string) => void;
}

export const ImageInput = React.memo(
  ({ type, file, onChange, onFileNameChange }: ImageInputProps) => {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        const selectedFile = event.target.files[0];
        onChange(selectedFile);
        if (onFileNameChange) {
          onFileNameChange(selectedFile.name);
        }
      }
    };

    const acceptAttribute = getFileAcceptAttribute(type);
    const maxFileSize = getMaxFileSize(type);

    return (
      <div className="space-y-4">
        <label
          htmlFor="fileUpload"
          className={cn(
            "flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed",
            "border-white/10 bg-white/[0.02] transition-colors hover:border-white/20 hover:bg-white/[0.05]"
          )}
        >
          <UploadCloud className="mb-3 h-10 w-10 text-gray-400" />
          <p className="mb-1 text-sm text-gray-400">
            <span className="font-semibold">Clique para enviar</span> ou arraste
            e solte
          </p>
          <p className="text-xs text-gray-400">
            {type.toUpperCase()} (MAX. {maxFileSize})
          </p>
          <Input
            id="fileUpload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={acceptAttribute}
          />
        </label>
        {file && (
          <p className="mt-2 text-center text-sm text-gray-100">
            Arquivo selecionado:{" "}
            <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>
    );
  }
);

ImageInput.displayName = "ImageInput";
