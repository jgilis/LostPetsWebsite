export function isOwner(
  ownerToken: string | null,
  ownerUserId: string | null
) {
  if (!ownerToken || !ownerUserId) {
    return false;
  }

  return ownerToken === ownerUserId;
}