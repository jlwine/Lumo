export type Partner = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type Relationship = {
  id: string;
  status: 'ACTIVE';
  startedAt: string;
  daysTogether: number;
  partner: Partner;
};

export type RelationshipResponse = {
  relationship: Relationship | null;
};