import { cn } from "@/lib/cn";

/**
 * FeedWren Logo Mark - uses the official FeedWren logo image
 * The logo is a light blue blob-like creature with oval eyes
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="FeedWren"
      width={32}
      height={32}
      className={cn("h-8 w-8 object-contain", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-bold tracking-tight text-foreground">
        FeedWren
      </span>
    </div>
  );
}
