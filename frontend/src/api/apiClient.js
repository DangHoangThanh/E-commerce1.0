const BASE_URL = "https://www.bachkhoaxanh.xyz";

/**
 * Generic function to handle various API requests (GET, POST, PUT, DELETE).
 * @param {string} endpoint - The specific path (e.g., "/products/all").
 * @param {object} [options={}] - An object containing METHOD, PARAMS, and BODY data.
 * @returns {Promise<object>} The parsed JSON data.
 */
export async function apiFetch(endpoint, options = {}) {
  // Set default method to GET
  const { method, params = {}, body } = options;

  // 1. BUILD QUERY STRING
  const queryParams = new URLSearchParams(params).toString();

  // 2. CONSTRUCT FULL URL
  const url = `${BASE_URL}${endpoint}${queryParams ? "?" + queryParams : ""}`;

  // 3. BUILD FETCH CONFIG
  // Try to pick up a token from localStorage (admin or user)
  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('adminToken') || localStorage.getItem('userToken')) : null;

  const config = {
    method: method,
    headers: {
      // Default headers if body not FormData
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      // Attach Authorization if token exists
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  // Add body if has
if (body) {
    // Check if the body is FormData; if so, pass it directly.
    // Otherwise, stringify it for JSON requests.
    if (body instanceof FormData) {
        config.body = body;
    } else {
        config.body = JSON.stringify(body);
    }
}

  // 4. FETCH
  console.log(`[API Fetch] Starting ${method} request...`);
  console.log(`[API Fetch] URL: ${url}`);
  console.log(`[API Fetch] config Headers: ${JSON.stringify(config.headers)}`);
  console.log(`[API Fetch] config Body: ${config.body}`);
  try {
    const res = await fetch(url, config); // Pass the config object

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})); // Try to parse error message
      const err = new Error(`HTTP error! Status: ${res.status} - ${errorData.message || res.statusText}`);
      // attach details for callers
      err.status = res.status;
      err.data = errorData;
      console.error("[API Fetch] HTTP error response data:", errorData);
      throw err;
    }

    // Ignore return data if status No Content
    if (res.status === 204 || res.status === 205) {
      console.log("[API Fetch] Success: No content (Status 204/205).");
      return null; // Return null or an empty object/status as success marker
    }

    // Return parsed JSON data
    const data = await res.json();
    console.log(`[API Fetch] Success. Parsed Data:`, data);
    return data;
  } catch (error) {
    console.error("API Fetch failed:", error);
    throw error;
  }
}
