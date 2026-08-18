import { File as FileIcon, Download } from "lucide-react";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface SecureAttachmentProps {
  url: string | null;
  name?: string | null;
  type?: string | null;
  bucket?: string;
}

/** Renders a private storage attachment via a short-lived signed URL. */
const SecureAttachment = ({ url, name, type, bucket = "message-attachments" }: SecureAttachmentProps) => {
  const signed = useSignedUrl(bucket, url);

  if (!url) return null;

  if (!signed) {
    return (
      <div className="h-10 rounded-lg border border-border bg-background/50 animate-pulse" aria-label="Loading attachment" />
    );
  }

  if (type?.startsWith("image/")) {
    return (
      <img
        src={signed}
        alt={name || "Attachment"}
        loading="lazy"
        className="rounded-lg max-w-full max-h-48 object-cover cursor-pointer"
        onClick={() => window.open(signed, "_blank", "noopener,noreferrer")}
      />
    );
  }

  return (
    <a
      href={signed}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Download ${name || "attachment"}`}
      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background/50 hover:bg-muted/50 transition-colors"
    >
      <FileIcon className="h-4 w-4 text-accent shrink-0" />
      <span className="text-xs text-foreground truncate">{name || "File"}</span>
      <Download className="h-3 w-3 text-muted-foreground shrink-0" />
    </a>
  );
};

export default SecureAttachment;
