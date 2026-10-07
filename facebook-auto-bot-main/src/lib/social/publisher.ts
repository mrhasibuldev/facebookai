/**
 * Social Publisher Abstraction
 *
 * Provides a unified interface for publishing to different social platforms.
 * Supports Facebook and Instagram, with extensibility for future platforms.
 */

import { publishPhoto } from "@/lib/facebook/client";
import {
  createMediaContainer,
  publishMedia,
  verifyPublishStatus,
} from "@/lib/instagram/client";
import type { Platform } from "@/lib/types";

export interface PublishInput {
  topic: string;
  title: string;
  description: string;
  hashtags: string[];
  imageUrl: string;
  linkUrl?: string;
  platformSpecificData?: Record<Platform, unknown>;
}

export interface PublishResult {
  platform: Platform;
  status: "success" | "failed";
  postId?: string;
  error?: string;
  timestamp: string;
}

export interface MultiPublishResult {
  overallStatus: "success" | "partial_success" | "failed";
  results: PublishResult[];
}

/**
 * Facebook Publisher
 */
class FacebookPublisher {
  async publish(input: PublishInput): Promise<PublishResult> {
    try {
      // Get page credentials from settings
      const { getSettings } = await import("@/lib/db/settings");
      const settings = await getSettings();

      if (!settings.default_page_id || !settings.default_page_token) {
        return {
          platform: "facebook",
          status: "failed",
          error: "No Facebook Page selected",
          timestamp: new Date().toISOString(),
        };
      }

      const { composeMessage } = await import("@/lib/types");
      const message = composeMessage(
        {
          title: input.title,
          description: input.description,
          hashtags: input.hashtags,
          link_url: input.linkUrl || null,
        },
        settings.utm_suffix
      );

      const result = await publishPhoto({
        pageId: settings.default_page_id,
        pageToken: settings.default_page_token,
        message,
        imageUrl: input.imageUrl,
      });

      return {
        platform: "facebook",
        status: "success",
        postId: result.id,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        platform: "facebook",
        status: "failed",
        error: err instanceof Error ? err.message : "Facebook publishing failed",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Instagram Publisher
 */
class InstagramPublisher {
  async publish(input: PublishInput): Promise<PublishResult> {
    try {
      const { getInstagramUserInfo, createMediaContainer, publishMedia, verifyPublishStatus } = await import("@/lib/instagram/client");

      const instagramAccount = await getInstagramUserInfo();
      if (!instagramAccount) {
        return {
          platform: "instagram",
          status: "failed",
          error: "No Instagram account connected",
          timestamp: new Date().toISOString(),
        };
      }

      // Compose caption
      const caption = [
        input.title,
        input.description,
        input.hashtags.map((h) => `#${h}`).join(" "),
        input.linkUrl || "",
      ]
        .filter(Boolean)
        .join("\n\n");

      // Create media container
      const container = await createMediaContainer(
        input.imageUrl,
        caption
      );

      // Publish media
      const result = await publishMedia(container.id);

      // Verify status (optional, for confirmation)
      const status = await verifyPublishStatus(result.id);
      if (status.status_code !== "PUBLISHED") {
        // Still return success if container was published, status may update asynchronously
        console.warn(`Instagram publish status: ${status.status_code}`);
      }

      return {
        platform: "instagram",
        status: "success",
        postId: result.id,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        platform: "instagram",
        status: "failed",
        error: err instanceof Error ? err.message : "Instagram publishing failed",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Multi-platform Publisher
 */
export class MultiPublisher {
  private facebookPublisher = new FacebookPublisher();
  private instagramPublisher = new InstagramPublisher();

  async publish(
    destinations: Platform[],
    input: PublishInput
  ): Promise<MultiPublishResult> {
    const results: PublishResult[] = [];

    for (const platform of destinations) {
      if (platform === "facebook") {
        results.push(await this.facebookPublisher.publish(input));
      } else if (platform === "instagram") {
        results.push(await this.instagramPublisher.publish(input));
      }
    }

    // Determine overall status
    const allSuccess = results.every((r) => r.status === "success");
    const anySuccess = results.some((r) => r.status === "success");

    const overallStatus = allSuccess
      ? "success"
      : anySuccess
      ? "partial_success"
      : "failed";

    return {
      overallStatus,
      results,
    };
  }
}
