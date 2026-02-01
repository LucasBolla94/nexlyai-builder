import { supabaseClient } from "@/lib/supabaseClient";

export async function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const { data } = await supabaseClient.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
