import { mockApi } from "@/api/mock";
import { getState } from "../store/contentStore";
import { syncSettings } from "./settingsApi";

/**
 * Dashboard-managed content.
 *
 * Reads use a zero delay rather than the usual 250ms: this is content the app
 * already holds in memory, not a network round trip, and the hero is the LCP
 * element — an artificial delay here shows as a blank first paint.
 */

/**
 * The hero slider. Staff edit it in Dashboard › Home page, which saves it in
 * settings (`home.hero`); until that has been saved, the bundled slides show.
 */
export function getHeroSlides() {
  return mockApi(async () => {
    await syncSettings();
    const saved = getState("settings").home?.hero;
    const { slides, autoplayMs } = saved?.slides?.length ? saved : getState("hero");
    return { slides: slides.filter((slide) => slide.active !== false && slide.image), autoplayMs: autoplayMs ?? 6000 };
  }, 0);
}

/** The Instagram grid: `home.instagram` from Dashboard › Home page, else the bundled posts. */
export function getInstagramPosts() {
  return mockApi(async () => {
    await syncSettings();
    const saved = getState("settings").home?.instagram;
    const { posts, handle } = saved?.posts?.length ? saved : getState("instagram");
    return { posts: posts.filter((p) => p.image), handle };
  }, 0);
}
