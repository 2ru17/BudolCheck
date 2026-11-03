import { create } from 'zustand';
import {
  ADMIN_QUEUE_PRESETS,
  SHOWCASE_CHECKS,
  TIPS_AND_GUIDES_PRESETS,
} from '../data/presets.ts';
import {
  analyzeProductInput,
  fetchCheckById,
  fetchPaginatedReviews,
} from '../lib/apiClient.ts';
import { detectLink, INVALID_LINK_MESSAGE } from '../lib/linkDetect.ts';
import {
  AdminQueueItem,
  PaginatedReviewsResponse,
  ProductCheckRecord,
  ProductSubTab,
  ReviewFilterType,
  ScreenId,
  TipGuideItem,
  UserRole,
} from '../types/budol.ts';

interface BudolState {
  currentScreen: ScreenId;
  currentSubTab: ProductSubTab;
  role: UserRole;
  userName: string;
  userEmail: string;
  connectedShop: string;
  activeCheckId: string;
  activeCheck: ProductCheckRecord;
  isLoadingCheck: boolean;
  reviewsFilter: ReviewFilterType;
  reviewsPage: number;
  paginatedReviews: PaginatedReviewsResponse;
  isLoadingReviews: boolean;
  savedCheckIds: string[];
  savedAt: Record<string, number>;
  hasListing: boolean;
  linkError: string | null;
  historyChecks: ProductCheckRecord[];
  tipsList: TipGuideItem[];
  adminQueue: AdminQueueItem[];
  toastMessage: string | null;

  navigateTo: (screen: ScreenId, subTab?: ProductSubTab) => void;
  setSubTab: (subTab: ProductSubTab) => void;
  setRole: (role: UserRole, navigateToRoleHome?: boolean) => void;
  updateUserProfile: (name: string, email: string, shop?: string) => void;
  loadProductCheck: (checkId: string) => Promise<void>;
  runLinkAnalysis: (rawInput: string) => Promise<boolean>;
  runImageAnalysis: (dataUrl: string, fileName: string) => Promise<void>;
  clearListing: () => void;
  dismissLinkError: () => void;
  setReviewsQuery: (filter: ReviewFilterType, page: number) => Promise<void>;
  toggleSavedCheck: (checkId?: string) => void;
  updateAdminQueueStatus: (itemId: string, status: 'flagged' | 'dismissed') => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

function getInitialScreenFromUrl(): { screen: ScreenId; tab: ProductSubTab } {
  if (typeof window === 'undefined') {
    return { screen: 'home', tab: 'overview' };
  }
  const params = new URLSearchParams(window.location.search);
  const rawScreen = params.get('screen') as ScreenId | null;
  const rawTab = params.get('tab') as ProductSubTab | null;

  const validScreens: ScreenId[] = [
    'front',
    'auth',
    'home',
    'product',
    'seller',
    'compare',
    'marketing',
    'redflags',
    'summary',
    'tips',
    'saved',
    'profile',
    'seller-dash',
    'admin-dash',
  ];
  const validTabs: ProductSubTab[] = ['overview', 'reviews', 'similar'];

  return {
    screen: rawScreen && validScreens.includes(rawScreen) ? rawScreen : 'home',
    tab: rawTab && validTabs.includes(rawTab) ? rawTab : 'overview',
  };
}

function syncUrlParams(screen: ScreenId, tab: ProductSubTab) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('screen', screen);
  if (screen === 'product') {
    url.searchParams.set('tab', tab);
  } else {
    url.searchParams.delete('tab');
  }
  window.history.replaceState({}, '', url.toString());
}

const HOUR_MS = 3_600_000;

const initialRoute = getInitialScreenFromUrl();
const defaultCheck = SHOWCASE_CHECKS[0];

export const useBudolStore = create<BudolState>((set, get) => ({
  currentScreen: initialRoute.screen,
  currentSubTab: initialRoute.tab,
  role: 'user',
  userName: 'Daisy',
  userEmail: 'daisy@budolcheck.ph',
  connectedShop: 'TikTok Shop & Shopee Connected',
  activeCheckId: defaultCheck.id,
  activeCheck: defaultCheck,
  isLoadingCheck: false,
  reviewsFilter: 'all',
  reviewsPage: 1,
  paginatedReviews: {
    items: defaultCheck.reviews.slice(0, 2),
    total: defaultCheck.reviews.length,
    page: 1,
    limit: 2,
    totalPages: Math.ceil(defaultCheck.reviews.length / 2),
  },
  isLoadingReviews: false,
  savedCheckIds: ['chk_cupmat_001', 'chk_serum_003'],
  savedAt: {
    chk_cupmat_001: Date.now() - 5 * HOUR_MS,
    chk_serum_003: Date.now() - 30 * HOUR_MS,
  },
  hasListing: true,
  linkError: null,
  historyChecks: SHOWCASE_CHECKS,
  tipsList: TIPS_AND_GUIDES_PRESETS,
  adminQueue: ADMIN_QUEUE_PRESETS,
  toastMessage: null,

  navigateTo: (screen, subTab) => {
    const nextTab = subTab || get().currentSubTab;
    syncUrlParams(screen, nextTab);
    set({ currentScreen: screen, currentSubTab: nextTab });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  setSubTab: (subTab) => {
    const currentScreen = get().currentScreen;
    syncUrlParams(currentScreen, subTab);
    set({ currentSubTab: subTab });
  },

  setRole: (role, navigateToRoleHome = true) => {
    set({ role });
    if (navigateToRoleHome) {
      if (role === 'seller') {
        get().navigateTo('seller-dash');
      } else if (role === 'admin') {
        get().navigateTo('admin-dash');
      } else {
        get().navigateTo('home');
      }
    }
    get().showToast(`Active perspective switched to ${role.toUpperCase()}`);
  },


  updateUserProfile: (name, email, shop) => {
    set((state) => ({
      userName: name.trim() || state.userName,
      userEmail: email.trim() || state.userEmail,
      connectedShop: shop || state.connectedShop,
    }));
  },

  loadProductCheck: async (checkId) => {
    set({ isLoadingCheck: true, activeCheckId: checkId });
    const uploaded = get().historyChecks.find(
      (item) => item.id === checkId && item.uploadedImageUrl
    );
    const record = uploaded || (await fetchCheckById(checkId));
    const reviewsPageData = await fetchPaginatedReviews(
      uploaded ? SHOWCASE_CHECKS[0].id : checkId,
      'all',
      1,
      2
    );
    set({
      activeCheck: record,
      hasListing: true,
      linkError: null,
      isLoadingCheck: false,
      reviewsFilter: 'all',
      reviewsPage: 1,
      paginatedReviews: reviewsPageData,
    });
  },

  runLinkAnalysis: async (rawInput) => {
    const detection = detectLink(rawInput);
    if (detection.kind === 'invalid') {
      set({ linkError: INVALID_LINK_MESSAGE });
      return false;
    }

    set({ isLoadingCheck: true, linkError: null });
    const baseRecord = await analyzeProductInput(rawInput);
    const isSocial = detection.kind === 'social';
    const analyzedRecord = {
      ...baseRecord,
      sourceUrl: isSocial ? rawInput.trim() : baseRecord.sourceUrl,
      importedFrom: isSocial ? detection.label : undefined,
      uploadedImageUrl: undefined,
    };
    const reviewsPageData = await fetchPaginatedReviews(
      analyzedRecord.id,
      'all',
      1,
      2
    );
    set((state) => {
      const existsInHistory = state.historyChecks.some(
        (item) => item.id === analyzedRecord.id
      );
      return {
        activeCheckId: analyzedRecord.id,
        activeCheck: analyzedRecord,
        hasListing: true,
        isLoadingCheck: false,
        reviewsFilter: 'all',
        reviewsPage: 1,
        paginatedReviews: reviewsPageData,
        historyChecks: existsInHistory
          ? state.historyChecks
          : [analyzedRecord, ...state.historyChecks],
      };
    });
    get().navigateTo('product', 'overview');
    get().showToast(`Loaded verification report for "${analyzedRecord.productTitle}"`);
    return true;
  },

  runImageAnalysis: async (dataUrl, fileName) => {
    set({ isLoadingCheck: true, linkError: null });
    const base = await analyzeProductInput('');
    const cleanName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    const record = {
      ...base,
      id: `chk_upload_${Date.now()}`,
      sourceUrl: `Uploaded image: ${fileName}`,
      productTitle: cleanName || 'Uploaded product photo',
      uploadedImageUrl: dataUrl,
      importedFrom: 'Image upload',
      checkedAt: new Date().toISOString(),
    };
    const reviewsPageData = await fetchPaginatedReviews(base.id, 'all', 1, 2);
    set((state) => ({
      activeCheckId: record.id,
      activeCheck: record,
      hasListing: true,
      isLoadingCheck: false,
      reviewsFilter: 'all',
      reviewsPage: 1,
      paginatedReviews: reviewsPageData,
      historyChecks: [record, ...state.historyChecks],
    }));
    get().navigateTo('product', 'overview');
    get().showToast('Image-only check created. Verify price and seller manually.');
  },

  clearListing: () => {
    set({ hasListing: false, linkError: null });
    get().navigateTo('home');
  },

  dismissLinkError: () => {
    set({ linkError: null });
  },

  setReviewsQuery: async (filter, page) => {
    const checkId = get().activeCheckId;
    set({ isLoadingReviews: true, reviewsFilter: filter, reviewsPage: page });
    const result = await fetchPaginatedReviews(checkId, filter, page, 2);
    set({
      paginatedReviews: result,
      reviewsPage: result.page,
      isLoadingReviews: false,
    });
  },

  toggleSavedCheck: (checkId) => {
    const targetId = checkId || get().activeCheckId;
    const currentSaved = get().savedCheckIds;
    const isSaved = currentSaved.includes(targetId);
    const nextSaved = isSaved
      ? currentSaved.filter((id) => id !== targetId)
      : [...currentSaved, targetId];
    set((state) => {
      const nextSavedAt = { ...state.savedAt };
      if (isSaved) delete nextSavedAt[targetId];
      else nextSavedAt[targetId] = Date.now();
      return { savedCheckIds: nextSaved, savedAt: nextSavedAt };
    });
    get().showToast(
      isSaved ? 'Removed item from Saved list' : 'Saved item to your list'
    );
  },

  updateAdminQueueStatus: (itemId, status) => {
    set((state) => ({
      adminQueue: state.adminQueue.map((item) =>
        item.id === itemId ? { ...item, status } : item
      ),
    }));
    get().showToast(
      status === 'flagged'
        ? 'Listing confirmed as high-risk scam'
        : 'Report dismissed by moderator'
    );
  },

  showToast: (message) => {
    set({ toastMessage: message });
  },

  clearToast: () => {
    set({ toastMessage: null });
  },
}));
