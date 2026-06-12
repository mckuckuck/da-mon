/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: video
 * Base block: video
 * Source: https://www.mongodb.com/resources/products/platform/webinar-with-gcp-hong-kong
 * Generated: 2026-06-11
 *
 * The video block (blocks/video) expects a single cell containing:
 *   - a link (<a>) to the video (YouTube / Vimeo / MP4) — used by decorate() as the play target
 *   - optionally a poster <picture>/<img> shown before playback
 *
 * IMPORTANT — source DOM has NO video URL:
 * On this React/Next.js page the player is a JS-driven widget. The hydrated static DOM under
 * `.media-container` contains ONLY:
 *   - a poster <img src=".../video-placeholder.svg"> (alt="")
 *   - a <button> wrapping an inline base64 SVG whose <title> is "play" (the play affordance)
 * There is no <a>, no .mp4, and no YouTube/Vimeo/watch URL anywhere in this region.
 *
 * Therefore this parser captures the POSTER IMAGE as the block's cell content. No video URL was
 * found in the static DOM, so none is emitted. An HTML comment placeholder is included to flag
 * that an author/developer must add the actual video link for the block to play. The poster <img>
 * is the only reliable content available from the source.
 *
 * Stable hook: `.media-container` (the only non-hashed class in this region; all other classes are
 * Emotion/Tailwind hashes). The poster image is found by its src ending in a placeholder svg, with
 * a fallback to the first non-button <img> inside the container (the play button's <img> is a
 * base64 SVG icon and is excluded).
 */
export default function parse(element, { document }) {
  // `element` is the .media-container div (per page-templates.json instance selector).
  // Locate the play button so we can exclude its inline SVG icon image.
  const playButton = element.querySelector('button');

  // Poster image: prefer an <img> whose src points at a placeholder/poster asset; otherwise the
  // first <img> that is NOT inside the play button (the button's image is a base64 SVG play icon).
  let poster = element.querySelector(
    'img[src*="video-placeholder"], img[src*="placeholder"], img[src*="poster"]',
  );
  if (!poster) {
    poster = Array.from(element.querySelectorAll('img')).find(
      (img) => !(playButton && playButton.contains(img)) && !/^data:/i.test(img.getAttribute('src') || ''),
    ) || null;
  }

  // Build the single content cell. With no video URL in the static DOM, the cell holds the poster
  // image plus a placeholder comment marking where the video link must be added manually.
  const cellContent = [];
  if (poster) cellContent.push(poster);
  cellContent.push(
    document.createComment(' TODO: add video link (YouTube/Vimeo/MP4) — no video URL was present in the source DOM '),
  );

  const cells = [cellContent];

  const block = WebImporter.Blocks.createBlock(document, { name: 'video', cells });
  element.replaceWith(block);
}
