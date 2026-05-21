/** Ownership helpers — auth.uid() only. */

export function isOwner(
  userId: string | null | undefined,
  ownerUserId: string | null | undefined,
): boolean {
  if (!userId || !ownerUserId) {
    return false;
  }

  return userId === ownerUserId;
}
