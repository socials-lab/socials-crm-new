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

function getCopyText(message: string | React.ReactNode, description: ExternalToast['description']) {
  const title =
    typeof message === 'string'
      ? message.trim()
      : typeof message === 'number'
        ? String(message)
        : '';

  const detail =
    typeof description === 'string'
      ? description.trim()
      : typeof description === 'number'
        ? String(description)
        : '';

  if (title && detail) {
    return `${title}\n${detail}`;
  }
  return title || detail;
}

// Wrapper that adds copy button to all toasts
const toast = Object.assign(
  (message: string | React.ReactNode, data?: ExternalToast) => {
    const copyText = getCopyText(message, data?.description);
    return sonnerToast(message, { ...data, action: copyText ? createCopyAction(copyText) : undefined });
  },
  {
    success: (message: string | React.ReactNode, data?: ExternalToast) => {
      const copyText = getCopyText(message, data?.description);
      return sonnerToast.success(message, { ...data, action: copyText ? createCopyAction(copyText) : undefined });
    },
    error: (message: string | React.ReactNode, data?: ExternalToast) => {
      const copyText = getCopyText(message, data?.description);
      return sonnerToast.error(message, { ...data, action: copyText ? createCopyAction(copyText) : undefined });
    },
    info: (message: string | React.ReactNode, data?: ExternalToast) => {
      const copyText = getCopyText(message, data?.description);
      return sonnerToast.info(message, { ...data, action: copyText ? createCopyAction(copyText) : undefined });
    },
    warning: (message: string | React.ReactNode, data?: ExternalToast) => {
      const copyText = getCopyText(message, data?.description);
      return sonnerToast.warning(message, { ...data, action: copyText ? createCopyAction(copyText) : undefined });
    },
    loading: (message: string | React.ReactNode, data?: ExternalToast) => {
      const copyText = getCopyText(message, data?.description);
      return sonnerToast.loading(message, { ...data, action: copyText ? createCopyAction(copyText) : undefined });
    },
    message: (message: string | React.ReactNode, data?: ExternalToast) => {
      const copyText = getCopyText(message, data?.description);
      return sonnerToast.message(message, { ...data, action: copyText ? createCopyAction(copyText) : undefined });
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
