import { publishPhoto, NoPageSelectedError } from "@/lib/facebook/client";
import { getPost, updatePostRecord } from "@/lib/db/posts";
import { getSettings } from "@/lib/db/settings";
import { composeMessage } from "@/lib/types";
import type { Post, AppSettings } from "@/lib/types";
import { MultiPublisher } from "@/lib/social/publisher";

/**
 * Publishes one queued post to its Facebook Page and records the outcome.
 * Shared by the "post now" route and the scheduled-queue cron worker so there
 * is exactly one place that talks to the Graph publish endpoint.
 *
 * Updated to support multi-destination publishing (Facebook, Instagram, or both).
 */
export async function publishPostNow(postId: string): Promise<Post> {
  const post = await getPost(postId);
  if (!post) throw new Error("Post not found.");

  const settings = await getSettings();

  // Determine destinations - use post's destinations if set, otherwise default to Facebook
  const destinations: ("facebook" | "instagram")[] =
    post.publish_destinations && post.publish_destinations.length > 0
      ? (post.publish_destinations as ("facebook" | "instagram")[])
      : ["facebook"];

  // If only Facebook is selected, use the original Facebook-only flow for backward compatibility
  if (destinations.length === 1 && destinations[0] === "facebook") {
    return publishToFacebookOnly(post, settings);
  }

  // Multi-destination publishing
  return publishToMultipleDestinations(post, settings, destinations);
}

/**
 * Original Facebook-only publishing flow (preserved for backward compatibility)
 */
async function publishToFacebookOnly(post: Post, settings: AppSettings): Promise<Post> {
  const pageId = post.page_id ?? settings.default_page_id;
  const pageToken =
    post.page_id && post.page_id !== settings.default_page_id ? null : settings.default_page_token;

  if (!pageId || !pageToken) {
    return updatePostRecord(post.id, {
      status: "failed",
      facebook_publish_status: "failed",
      error_message: new NoPageSelectedError().message,
    });
  }

  try {
    const result = await publishPhoto({
      pageId,
      pageToken,
      message: composeMessage(post, settings.utm_suffix),
      imageUrl: post.image_url,
    });

    return await updatePostRecord(post.id, {
      status: "posted",
      facebook_post_id: result.id,
      posted_at: new Date().toISOString(),
      facebook_publish_status: "success",
      error_message: null,
    });
  } catch (err) {
    let message = err instanceof Error ? err.message : "Unknown error while posting.";

    if (/\(#200\)|permissions? error/i.test(message)) {
      message =
        "Facebook rejected this for missing permissions. The connected token needs " +
        "pages_manage_posts. Add it to your Meta app — and to the Login for Business " +
        "configuration if you use one — then disconnect and connect again so a new " +
        "token is issued.";
    }

    return await updatePostRecord(post.id, {
      status: "failed",
      facebook_publish_status: "failed",
      facebook_error_message: message,
      error_message: message,
    });
  }
}

/**
 * Multi-destination publishing using the MultiPublisher abstraction
 */
async function publishToMultipleDestinations(
  post: Post,
  settings: AppSettings,
  destinations: ("facebook" | "instagram")[]
): Promise<Post> {
  const publisher = new MultiPublisher();

  const result = await publisher.publish(destinations, {
    topic: post.topic,
    title: post.title,
    description: post.description,
    hashtags: post.hashtags,
    imageUrl: post.image_url,
    linkUrl: post.link_url || undefined,
  });

  // Update post with per-platform results
  const updates: Partial<Post> = {
    posted_at: new Date().toISOString(),
  };

  // Set overall status based on results
  if (result.overallStatus === "success") {
    updates.status = "posted";
  } else if (result.overallStatus === "partial_success") {
    updates.status = "posted"; // Still mark as posted if at least one succeeded
  } else {
    updates.status = "failed";
  }

  // Update per-platform status
  for (const platformResult of result.results) {
    if (platformResult.platform === "facebook") {
      updates.facebook_publish_status = platformResult.status;
      updates.facebook_post_id = platformResult.postId || null;
      updates.facebook_error_message = platformResult.error || null;
    } else if (platformResult.platform === "instagram") {
      updates.instagram_publish_status = platformResult.status;
      updates.instagram_post_id = platformResult.postId || null;
      updates.instagram_error_message = platformResult.error || null;
    }
  }

  return await updatePostRecord(post.id, updates);
}
