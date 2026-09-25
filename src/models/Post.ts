export interface PostComment {
  id: string;
  userName: string;
  userHandle: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface CommunityPost {
  id: string;
  userName: string;
  userHandle: string;
  userAvatar?: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
    totalVotes: number;
  };
  workoutTag?: string;
  likes: number;
  commentsCount: number;
  comments: PostComment[];
  isLiked: boolean;
  createdAt: string;
  tab: 'for_you' | 'following';
}
