"use client";

import React from "react";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { urlPlaceholders } from "~/lib/input-modal-utils";

interface UrlInputProps {
  type: string;
  inputValue: string;
  onChange: (value: string) => void;
  limitPages?: boolean;
  onLimitPagesChange?: (checked: boolean) => void;
}

export const UrlInput = React.memo(
  ({
    type,
    inputValue,
    onChange,
    limitPages,
    onLimitPagesChange,
  }: UrlInputProps) => {
    const placeholder = urlPlaceholders[type] || "Cole a URL aqui";

    return (
      <div className="space-y-4">
        <Input
          type="url"
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-white/10 bg-white/[0.05] text-gray-100 placeholder:text-gray-500 focus:border-white/20"
        />
        {type === "website" && onLimitPagesChange && (
          <div className="mt-3 flex items-center space-x-2">
            <Checkbox
              id="limitPages"
              checked={limitPages}
              onCheckedChange={(checked) =>
                onLimitPagesChange(checked as boolean)
              }
            />
            <Label htmlFor="limitPages" className="text-sm text-gray-400">
              Limitar número de páginas para carregar
            </Label>
          </div>
        )}
      </div>
    );
  }
);

UrlInput.displayName = "UrlInput";

// Twitter-specific URL input
interface TwitterInputProps {
  username: string;
  url: string;
  onUsernameChange: (value: string) => void;
  onUrlChange: (value: string) => void;
}

export const TwitterInput = React.memo(
  ({ username, url, onUsernameChange, onUrlChange }: TwitterInputProps) => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="twitterUser" className="mb-1.5 block text-gray-400">
            Nome de usuário
          </Label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
              @
            </span>
            <Input
              id="twitterUser"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="border-white/10 bg-white/[0.05] pl-7 text-gray-100 placeholder:text-gray-500 focus:border-white/20"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="twitterURL" className="mb-1.5 block text-gray-400">
            URL do Tweet (opcional)
          </Label>
          <Input
            id="twitterURL"
            type="text"
            placeholder="https://x.com/username/status/..."
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="border-white/10 bg-white/[0.05] text-gray-100 placeholder:text-gray-500 focus:border-white/20"
          />
        </div>
      </div>
    );
  }
);

TwitterInput.displayName = "TwitterInput";
