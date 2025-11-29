export async function apiFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  }

  return response;
}
