export type SearchUser = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ProfilePartner = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type PublicUserProfile = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;

  relationship: {
    status: 'SINGLE' | 'ACTIVE';
    partner: ProfilePartner | null;
    startedAt: string | null;
  };

  actions: {
    canInvite: boolean;

    inviteUnavailableReason:
      | 'SELF'
      | 'CURRENT_USER_IN_RELATIONSHIP'
      | 'USER_IN_RELATIONSHIP'
      | 'INVITATION_ALREADY_EXISTS'
      | null;
  };

  invitation: {
    id: string;
    status: string;
    direction: 'SENT' | 'RECEIVED';
  } | null;
};