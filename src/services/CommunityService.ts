import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CommunityPost, PostComment } from '../models/Post';

const STORAGE_KEY = '@dallas/community_posts';

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    userName: 'Lucas Ferreira',
    userHandle: '@lucasf',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    text: 'Treino de hoje concluído! Upper A pesado 💪\nO foco agora é manter a consistência.',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
    workoutTag: 'Upper A',
    likes: 24,
    commentsCount: 3,
    isLiked: false,
    createdAt: '2h',
    tab: 'for_you',
    comments: [
      {
        id: 'c-1',
        userName: 'João Silva',
        userHandle: '@joaos',
        text: 'Esse banco é muito bom! Qual o modelo?',
        createdAt: '1h',
        likes: 1,
      },
      {
        id: 'c-2',
        userName: 'Mariana Souza',
        userHandle: '@marisouza',
        text: 'Bora! Consistência é o segredo 🔥',
        createdAt: '1h',
        likes: 1,
      },
    ],
  },
  {
    id: 'post-2',
    userName: 'Mariana Souza',
    userHandle: '@marisouza',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    text: 'Qual a opinião de vocês sobre ajustar o volume quando não consegue completar todas as reps?',
    likes: 12,
    commentsCount: 18,
    isLiked: true,
    createdAt: '4h',
    tab: 'for_you',
    comments: [
      {
        id: 'c-3',
        userName: 'Carlos Mendes',
        userHandle: '@carlosm',
        text: 'Geralmente mantenho a carga e tento diminuir o descanso ou aceito 1 rep a menos com boa técnica.',
        createdAt: '3h',
        likes: 4,
      },
    ],
  },
  {
    id: 'post-3',
    userName: 'Felipe Rocha',
    userHandle: '@feliper',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    text: 'Novo PR no Supino Reto: 120kg para 3 reps limpas! A dica de retração escapular fez toda diferença.',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
    workoutTag: 'Supino Reto • PR',
    likes: 42,
    commentsCount: 7,
    isLiked: false,
    createdAt: '6h',
    tab: 'following',
    comments: [],
  },
];

export class CommunityService {
  async getPosts(tab: 'for_you' | 'following'): Promise<CommunityPost[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
        return INITIAL_POSTS.filter((p) => tab === 'for_you' || p.tab === tab);
      }
      const all: CommunityPost[] = JSON.parse(raw);
      if (tab === 'for_you') return all;
      return all.filter((p) => p.tab === 'following' || p.likes > 15);
    } catch {
      return INITIAL_POSTS;
    }
  }

  async getPostById(id: string): Promise<CommunityPost | undefined> {
    const posts = await this.getPosts('for_you');
    return posts.find((p) => p.id === id);
  }

  async toggleLike(id: string): Promise<CommunityPost | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const posts: CommunityPost[] = raw ? JSON.parse(raw) : INITIAL_POSTS;
    const post = posts.find((p) => p.id === id);
    if (!post) return null;

    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return post;
  }

  async addComment(postId: string, text: string, userName = 'Eduardo', userHandle = '@eduardo'): Promise<PostComment | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const posts: CommunityPost[] = raw ? JSON.parse(raw) : INITIAL_POSTS;
    const post = posts.find((p) => p.id === postId);
    if (!post) return null;

    const newComment: PostComment = {
      id: `c-${Date.now()}`,
      userName,
      userHandle,
      text: text.trim(),
      createdAt: 'agora',
      likes: 0,
    };

    post.comments.push(newComment);
    post.commentsCount = post.comments.length;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return newComment;
  }

  async createPost(text: string, imageUrl?: string, workoutTag?: string): Promise<CommunityPost> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const posts: CommunityPost[] = raw ? JSON.parse(raw) : INITIAL_POSTS;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      userName: 'Eduardo',
      userHandle: '@eduardo',
      text: text.trim(),
      imageUrl,
      workoutTag,
      likes: 0,
      commentsCount: 0,
      comments: [],
      isLiked: false,
      createdAt: 'agora',
      tab: 'for_you',
    };

    posts.unshift(newPost);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return newPost;
  }
}

export const communityService = new CommunityService();
