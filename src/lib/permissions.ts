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

/** Exact sighting coordinates: report owner or administrator only. */
export function canSeeExactSightings(
  userId: string | null | undefined,
  isAdmin: boolean,
  ownerUserId: string | null | undefined,
): boolean {
  return isAdmin || isOwner(userId, ownerUserId);
}
