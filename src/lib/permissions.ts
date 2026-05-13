export function isOwner(
  ownerToken: string | null,
  ownerUserId: string | null
) {
  if (!ownerToken || !ownerUserId) {
    return false;
  }

  return ownerToken === ownerUserId;
}

export function isAdminUser(isAdmin: boolean) {
  return isAdmin === true;
}

export function canViewSighting(params: {
  sightingStatus: string;
  isAdmin: boolean;
  isOwner: boolean;
}) {
  const {
    sightingStatus,
    isAdmin,
    isOwner,
  } = params;

  // admins can always view
  if (isAdmin) {
    return true;
  }

  // owners can only view approved sightings
  if (
    isOwner &&
    sightingStatus === "approved"
  ) {
    return true;
  }

  return false;
}

export function canModerateSightings(
  isAdmin: boolean
) {
  return isAdmin === true;
}

export function canViewNotifications(
  ownerToken: string | null
) {
  return !!ownerToken;
}