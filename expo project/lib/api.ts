import { API_URL } from "./config";

export async function fetchPosts() {
  const res = await fetch(`${API_URL}/posts`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function addPost(text: string, emojis: string[]) {
  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, emojis }),
  });
  if (!res.ok) throw new Error("Failed to add post");
  return res.json();
}

export async function deletePost(id: string) {
  const res = await fetch(`${API_URL}/posts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete post");
}

export async function fetchRequests() {
  const res = await fetch(`${API_URL}/requests`);
  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json();
}

export async function addRequest(feeling: string) {
  const res = await fetch(`${API_URL}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feeling }),
  });
  if (!res.ok) throw new Error("Failed to add request");
  return res.json();
}

export async function markRequestReviewed(id: string) {
  const res = await fetch(`${API_URL}/requests/${id}/review`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark request as reviewed");
}

export async function deleteRequest(id: string) {
  const res = await fetch(`${API_URL}/requests/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete request");
}
