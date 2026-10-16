/* Http Client */
import { apiTimeout, apiUrl } from "./config";
import { apiErrorFromBody, networkError } from "./error";
import { accessToken } from "./tokens";
import { refreshSession } from "./refresh";

/**
 * Every call names its realm. There is no ambient "current user" here, because
 * a staff token reaching a storefront request is the bug this whole layer is
 * shaped to prevent.
 */

async function request(method, path, options = {}) {
  // `timeout` overrides the default for the few calls that need longer — a
  // 100 MB video upload cannot finish inside a timeout sized for JSON.
  const { body, params, realm = "customer", headers, signal, retry = true, timeout = apiTimeout } = options;
  const hadToken = Boolean(accessToken(realm));
  const control = abortAfter(timeout, signal);
  let response;

  try {
    response = await fetch(apiUrl(path, params), {
      method,
      signal: control.signal,
      // Sends the httpOnly refresh cookie. Same-origin through the proxy, so
      // this costs no preflight.
      credentials: "include",
      headers: buildHeaders({ body, headers, realm }),
      body: serialize(body),
    });
  } catch (cause) {
    throw networkError(cause);
  } finally {
    control.done();
  }

  // Only refresh when a token was actually presented and rejected. A 401 with
  // no token means the caller is signed out, and refreshing on that would fire
  // a pointless round-trip on every anonymous request that touches a guarded
  // route. Restoring a session on boot is the auth context's job, not a 401's.
  if (response.status === 401 && retry && hadToken) {
    await refreshSession(realm);
    return request(method, path, { ...options, retry: false });
  }

  return unwrap(response);
}

function buildHeaders({ body, headers, realm }) {
  const token = accessToken(realm);
  return {
    Accept: "application/json",
    // FormData sets its own multipart boundary; naming a type here breaks it.
    ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

function serialize(body) {
  if (body === undefined || body === null) return undefined;
  return body instanceof FormData ? body : JSON.stringify(body);
}

/**
 * The API answers `{ data }` on success, with `{ meta }` alongside it on a
 * paged collection, and `{ error }` on failure. Both halves are returned so
 * `list` can hand back the page count; collapsing to `data` here is what threw
 * pagination away.
 */
async function unwrap(response) {
  if (response.status === 204) return { data: null, meta: null };

  const body = await response.json().catch(() => null);
  if (!response.ok) throw apiErrorFromBody(response.status, body);

  if (body && typeof body === "object" && "data" in body) {
    return { data: body.data, meta: body.meta ?? null };
  }
  return { data: body, meta: null };
}

function abortAfter(ms, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

export const http = {
  get: async (path, options) => (await request("GET", path, options)).data,
  post: async (path, body, options) => (await request("POST", path, { ...options, body })).data,
  patch: async (path, body, options) => (await request("PATCH", path, { ...options, body })).data,
  put: async (path, body, options) => (await request("PUT", path, { ...options, body })).data,
  del: async (path, options) => (await request("DELETE", path, options)).data,

  /** A paged collection: `{ items, meta }` rather than a bare array. */
  list: async (path, options) => {
    const { data, meta } = await request("GET", path, options);
    return { items: data ?? [], meta };
  },
};
