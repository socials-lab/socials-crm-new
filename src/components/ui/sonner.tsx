import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast, ExternalToast } from "sonner";
import { Copy, Check } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Helper to create action with copy button
const createCopyAction = (message: string) => ({
  label: <Copy className="h-3.5 w-3.5" />,
  onClick: () => {
    navigator.clipboard.writeText(message).then(() => {
      sonnerToast(<span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Zkopírováno</span>, { duration: 1500 });
    });
  },
});

// Wrapper that adds copy button to all toasts
const toast = Object.assign(
  (message: string | React.ReactNode, data?: ExternalToast) => {
    const msg = typeof message === 'string' ? message : '';
    return sonnerToast(message, { ...data, action: msg ? createCopyAction(msg) : undefined });
  },
  {
    success: (message: string | React.ReactNode, data?: ExternalToast) => {
      const msg = typeof message === 'string' ? message : '';
      return sonnerToast.success(message, { ...data, action: msg ? createCopyAction(msg) : undefined });
    },
    error: (message: string | React.ReactNode, data?: ExternalToast) => {
      const msg = typeof message === 'string' ? message : '';
      return sonnerToast.error(message, { ...data, action: msg ? createCopyAction(msg) : undefined });
    },
    info: (message: string | React.ReactNode, data?: ExternalToast) => {
      const msg = typeof message === 'string' ? message : '';
      return sonnerToast.info(message, { ...data, action: msg ? createCopyAction(msg) : undefined });
    },
    warning: (message: string | React.ReactNode, data?: ExternalToast) => {
      const msg = typeof message === 'string' ? message : '';
      return sonnerToast.warning(message, { ...data, action: msg ? createCopyAction(msg) : undefined });
    },
    loading: (message: string | React.ReactNode, data?: ExternalToast) => {
      const msg = typeof message === 'string' ? message : '';
      return sonnerToast.loading(message, { ...data, action: msg ? createCopyAction(msg) : undefined });
    },
    message: (message: string | React.ReactNode, data?: ExternalToast) => {
      const msg = typeof message === 'string' ? message : '';
      return sonnerToast.message(message, { ...data, action: msg ? createCopyAction(msg) : undefined });
    },
    // Pass through methods that don't need copy button
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    custom: sonnerToast.custom,
  }
);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={6000}
      style={{ zIndex: 9999, pointerEvents: 'auto' }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:h-7 group-[.toast]:px-2",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
