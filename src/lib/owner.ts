export function getOwnerToken() {
  if (typeof window === "undefined") {
    return null;
  }

  let token = localStorage.getItem("owner_token");

  if (!token) {
    token = crypto.randomUUID();

    localStorage.setItem("owner_token", token);
  }

  return token;
}