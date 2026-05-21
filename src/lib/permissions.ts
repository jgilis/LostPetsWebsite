/** Ownership and access helpers — auth.uid() only (no owner_token). */

export function isOwner(
  userId: string | null | undefined,
  ownerUserId: string | null | undefined,
): boolean {
  if (!userId || !ownerUserId) {
    return false;
  }

  return userId === ownerUserId;
}

export function isAdminUser(isAdmin: boolean) {
  return isAdmin === true;
}

export function canViewSighting(params: {
  sightingStatus: string;
  isAdmin: boolean;
  isOwner: boolean;
}) {
  const { sightingStatus, isAdmin, isOwner: reportOwner } = params;

  if (isAdmin) {
    return true;
  }

  if (reportOwner && sightingStatus === "approved") {
    return true;
  }

  return false;
}

export function canModerateSightings(isAdmin: boolean) {
  return isAdmin === true;
}

export function canViewNotifications(userId: string | null | undefined) {
  return !!userId;
}
