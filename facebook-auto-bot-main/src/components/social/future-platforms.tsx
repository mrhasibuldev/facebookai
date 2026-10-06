"use client";

import { Lock } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface SocialPlatform {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "coming-soon" | "locked";
}

const FUTURE_PLATFORMS: SocialPlatform[] = [
  {
    id: "instagram",
    name: "Instagram",
    description: "Publish and manage visual content on Instagram.",
    icon: <InstagramLogo />,
    status: "coming-soon",
  },
  {
    id: "x",
    name: "X",
    description: "Publish posts and manage your X content.",
    icon: <XLogo />,
    status: "coming-soon",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Share professional content and updates on LinkedIn.",
    icon: <LinkedinLogo />,
    status: "coming-soon",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Prepare and publish short-form video content on TikTok.",
    icon: <TiktokLogo />,
    status: "coming-soon",
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Manage video publishing workflows for YouTube.",
    icon: <YoutubeLogo />,
    status: "coming-soon",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    description: "Publish visual content and manage Pinterest publishing.",
    icon: <PinterestLogo />,
    status: "coming-soon",
  },
  {
    id: "reddit",
    name: "Reddit",
    description: "Share relevant content across Reddit communities.",
    icon: <RedditLogo />,
    status: "coming-soon",
  },
  {
    id: "threads",
    name: "Threads",
    description: "Publish short-form conversations and updates on Threads.",
    icon: <ThreadsLogo />,
    status: "coming-soon",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    description: "Publish and manage posts on Bluesky.",
    icon: <BlueskyLogo />,
    status: "coming-soon",
  },
];

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TiktokLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.49.03-3.05-.36-4.15-1.46-1.16-1.16-1.63-2.79-1.6-4.42.03-1.63.64-3.19 1.73-4.35 1.12-1.19 2.76-1.72 4.34-1.7V9.3c-1.31-.07-2.62.35-3.7 1.14-1.08.79-1.88 1.95-2.26 3.22-.48 1.52-.34 3.18.4 4.63.74 1.45 2.06 2.6 3.6 3.13 1.54.53 3.26.49 4.77-.12 1.49-.61 2.68-1.88 3.18-3.34.06-.17.12-.35.18-.53V12.06c-1.31.07-2.62-.36-3.7-1.15-1.08-.79-1.88-1.95-2.26-3.22-.48-1.52-.34-3.18.4-4.63.74-1.45 2.06-2.6 3.6-3.13 1.54-.53 3.26-.49 4.77.12 1.49.61 2.68 1.88 3.18 3.34.06.17.12.35.18.53V.02z" />
    </svg>
  );
}

function YoutubeLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function PinterestLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  );
}

function RedditLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.855-1.42 4.715-1.473l.8-3.747-2.597.547a1.25 1.25 0 0 1-1.248-1.306c0-.688.56-1.249 1.248-1.249zm-6.453 5.67c.968 0 1.754.786 1.754 1.754 0 .968-.786 1.754-1.754 1.754-.968 0-1.754-.786-1.754-1.754 0-.968.786-1.754 1.754-1.754zm7.5 0c.968 0 1.754.786 1.754 1.754 0 .968-.786 1.754-1.754 1.754-.968 0-1.754-.786-1.754-1.754 0-.968.786-1.754 1.754-1.754zm-3.557 5.835c.88 0 1.56.523 1.653 1.243-.984.675-2.633.675-3.617 0 .093-.72.773-1.243 1.653-1.243z" />
    </svg>
  );
}

function ThreadsLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 5c2.33 0 4.31-1.46 5.11-3.5H14c-.4 1.17-1.48 2-2.76 2s-2.36-.83-2.76-2H6.39c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}

function BlueskyLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 7h-2v5h-2V9H9v5H7V9H5v5c0 1.1.9 2 2 2h2v3h2v-3h2c1.1 0 2-.9 2-2V9z" />
    </svg>
  );
}

interface SocialPlatformCardProps {
  platform: SocialPlatform;
}

function SocialPlatformCard({ platform }: SocialPlatformCardProps) {
  const handleConnectClick = () => {
    // Show subtle feedback that this is coming soon
    // No actual OAuth or connection
  };

  return (
    <Card className="flex flex-col gap-3 p-4 transition-all hover:border-border/50">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground">
          {platform.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold text-foreground">{platform.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{platform.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Lock size={12} />
          Coming Soon
        </div>
        <Button size="sm" variant="secondary" disabled onClick={handleConnectClick}>
          Connect
        </Button>
      </div>
    </Card>
  );
}

export function FutureSocialPlatforms() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading font-bold text-foreground">More Social Platforms</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Connect FeedWren with more platforms in the future and manage your publishing workflow from one place.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FUTURE_PLATFORMS.map((platform) => (
          <SocialPlatformCard key={platform.id} platform={platform} />
        ))}
      </div>
    </div>
  );
}
