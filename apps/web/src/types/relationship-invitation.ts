export type InvitationUser = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ReceivedRelationshipInvitation = {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING';
  createdAt: string;
  respondedAt: string | null;
  sender: InvitationUser;
};

export type SentRelationshipInvitation = {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING';
  createdAt: string;
  respondedAt: string | null;
  receiver: InvitationUser;
};

export type RelationshipInvitationsResponse = {
  received: ReceivedRelationshipInvitation[];
  sent: SentRelationshipInvitation[];
};