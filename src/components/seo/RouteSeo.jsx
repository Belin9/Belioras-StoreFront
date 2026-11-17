/* SEO Component: the head for pages whose address says it all */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { applyHead, SITE_URL } from "../../seo/head";
import { homeSeo, isPrivatePath, STATIC_PAGES } from "../../seo/seo";
import { getSettings } from "../../services/content/settingsApi";

/**
 * Sets the head on every route change: fixed pages from STATIC_PAGES, private
 * areas as noindex, and anything else back to the site defaults until its own
 * <Seo> (product, catalogue, 404) replaces them. Sits before <Routes> so that
 * <Seo> effects in the same commit run after it and win.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.replace(/\/+$/, "") || "/";
    if (isPrivatePath(path)) applyHead({ noindex: true });
    else if (STATIC_PAGES[path]) applyHead(path === "/" ? homeSeo(SITE_URL) : { ...STATIC_PAGES[path], path });
    else applyHead({});

    // The home page's structured data names the boutique's email and social
    // accounts, which Settings holds; it is filled in once they arrive.
    if (path !== "/") return undefined;
    let current = true;
    getSettings()
      .then((settings) => current && applyHead(homeSeo(SITE_URL, settings)))
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [pathname]);

  return null;
}
