import { useState, useRef, useCallback } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AvatarUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export function AvatarUpload({ 
  value, 
  onChange, 
  name = '', 
  disabled = false,
  className 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Prosím nahrajte obrázek (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Obrázek je příliš velký. Maximální velikost je 5 MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Create a canvas to crop image to 1:1
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        
        // Resize to 400x400 max for performance
        const targetSize = Math.min(size, 400);
        canvas.width = targetSize;
        canvas.height = targetSize;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img, 
            offsetX, offsetY, size, size,
            0, 0, targetSize, targetSize
          );
          
          // Convert to base64 (in production, upload to storage)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(dataUrl);
          toast.success('Fotka nahrána');
        }
        
        URL.revokeObjectURL(objectUrl);
        setIsUploading(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast.error('Nepodařilo se načíst obrázek');
        setIsUploading(false);
      };

      img.src = objectUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Chyba při nahrávání fotky');
      setIsUploading(false);
    }
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "relative group",
          dragActive && "ring-2 ring-primary ring-offset-2 rounded-full"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Avatar className="h-24 w-24 border-2 border-border">
          {value ? (
            <AvatarImage src={value} alt="Profilová fotka" className="object-cover" />
          ) : null}
          <AvatarFallback className="text-xl bg-muted">
            {name ? getInitials(name) : <Camera className="h-8 w-8 text-muted-foreground" />}
          </AvatarFallback>
        </Avatar>

        {/* Overlay on hover */}
        {!disabled && !isUploading && (
          <div 
            className={cn(
              "absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
              value && "opacity-0"
            )}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}

        {/* Remove button */}
        {value && !disabled && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {!value && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4" />
          Nahrát fotku
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Formát 1:1, max 5 MB
      </p>
    </div>
  );
}
