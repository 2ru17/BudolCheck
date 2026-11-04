import { create } from 'zustand';
import {
  ADMIN_QUEUE_PRESETS,
  SHOWCASE_CHECKS,
  TIPS_AND_GUIDES_PRESETS,
} from '../data/presets.ts';
import {
  analyzeProductInput,
  changeAccountPassword,
  connectShopAccount,
  ConnectShopInput,
  createAdminQueueItemOnServer,
  createCheckFromCatalogId,
  fetchAdminQueue,
  fetchAllChecks,
  fetchCheckById,
  fetchCurrentSession,
  fetchPaginatedReviews,
  fetchSavedChecksState,
  fetchTipsAndGuides,
  invalidateClientCache,
  loginWithGoogleToken,
  loginWithPassword,
  logoutAccount,
  patchAdminQueueStatus,
  patchUserProfileOnServer,
  registerAccount,
  requestPasswordResetCode,
  resetPasswordWithCode,
  searchMarketplaceListings,
  toggleSavedCheckOnServer,
} from '../lib/apiClient.ts';
import { detectLink, INVALID_LINK_MESSAGE } from '../lib/linkDetect.ts';
import {
  AdminQueueItem,
  AdminReportStatus,
  AuthUser,
  IllustrationKey,
  MarketplaceSearchResponse,
  PaginatedReviewsResponse,
  ProductCheckRecord,
  ProductSubTab,
  ReviewFilterType,
  ScreenId,
  TipGuideItem,
  UserRole,
} from '../types/budol.ts';

export type SearchPlatformFilter = 'all' | 'Shopee' | 'Lazada' | 'Temu';
export type SellerPortalTabId = 'home' | 'products' | 'feedback' | 'guidelines' | 'profile';
export type AdminConsoleTabId = 'home' | 'users' | 'reports' | 'settings';

interface BudolState {
  currentScreen: ScreenId;
  currentSubTab: ProductSubTab;
  sellerPortalTab: SellerPortalTabId;
  adminConsoleTab: AdminConsoleTabId;
  isAuthenticated: boolean;
  authUser: AuthUser | null;
  authLoading: boolean;
  role: UserRole;
  userName: string;
  userEmail: string;
  connectedShop: string;
  activeCheckId: string;
  activeCheck: ProductCheckRecord;
  isLoadingCheck: boolean;
  searchResults: MarketplaceSearchResponse | null;
  searchQuery: string;
  searchPlatformFilter: SearchPlatformFilter;
  isSearchingCatalog: boolean;
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
  hasHydratedBackend: boolean;

  hydrateFromBackend: () => Promise<void>;
  navigateTo: (screen: ScreenId, subTab?: ProductSubTab) => void;
  setSubTab: (subTab: ProductSubTab) => void;
  setSellerPortalTab: (tab: SellerPortalTabId) => void;
  setAdminConsoleTab: (tab: AdminConsoleTabId) => void;
  submitReportToAdminQueue: (input: {
    productTitle: string;
    subtitle?: string;
    platform: 'Shopee' | 'Lazada' | 'Temu';
    flagReason: string;
    reportCategory?: 'report' | 'complaint';
    priceAnomaly?: string;
    illustrationKey?: IllustrationKey;
    thumbnailUrl?: string;
    sourceUrl?: string;
  }) => Promise<AdminQueueItem>;
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    fullName: string;
    email: string;
    password: string;
    role?: 'user' | 'seller';
  }) => Promise<void>;
  connectShop: (input: 'Shopee' | 'Lazada' | 'Temu' | ConnectShopInput) => Promise<void>;
  loginWithGoogle: (credential: string, role?: 'user' | 'seller') => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{
    sent: boolean;
    message: string;
    expiresInMinutes: number;
    resetCodePreview?: string;
  }>;
  resetPassword: (params: {
    email: string;
    code: string;
    newPassword: string;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, email: string, shop?: string) => Promise<void>;
  loadProductCheck: (checkId: string) => Promise<void>;
  runKeywordSearch: (query: string, platform?: SearchPlatformFilter) => Promise<void>;
  setSearchPlatformFilter: (platform: SearchPlatformFilter) => Promise<void>;
  clearSearchResults: () => void;
  selectCatalogListingForCheck: (catalogId: string) => Promise<void>;
  runLinkAnalysis: (rawInput: string) => Promise<boolean>;
  runImageAnalysis: (dataUrl: string, fileName: string) => Promise<void>;
  clearListing: () => void;
  dismissLinkError: () => void;
  setReviewsQuery: (filter: ReviewFilterType, page: number) => Promise<void>;
  toggleSavedCheck: (checkId?: string) => void;
  updateAdminQueueStatus: (itemId: string, status: AdminReportStatus) => void;
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
    'privacy',
    'terms',
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

const initialRoute = getInitialScreenFromUrl();
const defaultCheck = SHOWCASE_CHECKS[0];

export const useBudolStore = create<BudolState>((set, get) => ({
  currentScreen: initialRoute.screen,
  currentSubTab: initialRoute.tab,
  sellerPortalTab: 'home',
  adminConsoleTab: 'home',
  isAuthenticated: false,
  authUser: null,
  authLoading: false,
  role: 'user',
  userName: 'Guest',
  userEmail: '',
  connectedShop: 'Guest Session',
  activeCheckId: defaultCheck.id,
  activeCheck: defaultCheck,
  isLoadingCheck: false,
  searchResults: null,
  searchQuery: '',
  searchPlatformFilter: 'all',
  isSearchingCatalog: false,
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
  savedCheckIds: [],
  savedAt: {},
  hasListing: true,
  linkError: null,
  historyChecks: SHOWCASE_CHECKS,
  tipsList: TIPS_AND_GUIDES_PRESETS,
  adminQueue: ADMIN_QUEUE_PRESETS,
  toastMessage: null,
  hasHydratedBackend: false,

  hydrateFromBackend: async () => {
    if (get().hasHydratedBackend) return;
    set({ hasHydratedBackend: true });

    const [session, checks, tips, queue, savedState] = await Promise.all([
      fetchCurrentSession(),
      fetchAllChecks(),
      fetchTipsAndGuides(),
      fetchAdminQueue(),
      fetchSavedChecksState(),
    ]);

    set((state) => {
      const localUploads = state.historyChecks.filter((c) => c.uploadedImageUrl);
      const validChecks = checks.filter(
        (c) => (c.platformName as string) !== 'TikTok Shop' && c.id !== 'chk_cupmat_001'
      );
      const mergedHistory = [
        ...localUploads,
        ...validChecks.filter((c) => !localUploads.some((u) => u.id === c.id)),
      ];
      const candidateActive =
        mergedHistory.find((c) => c.id === state.activeCheckId) ||
        mergedHistory[0] ||
        state.activeCheck;
      const refreshedActive =
        (candidateActive.platformName as string) === 'TikTok Shop' ||
        candidateActive.id === 'chk_cupmat_001'
          ? SHOWCASE_CHECKS[0]
          : candidateActive;

      const user = session.authenticated && session.user ? session.user : null;

      return {
        isAuthenticated: Boolean(user),
        authUser: user,
        role: user ? user.role : 'user',
        userName: user ? user.fullName : 'Guest',
        userEmail: user ? user.email : '',
        connectedShop: user ? user.connectedShop : 'Guest Session',
        historyChecks: mergedHistory.length > 0 ? mergedHistory : SHOWCASE_CHECKS,
        activeCheckId: refreshedActive.id,
        activeCheck: refreshedActive,
        tipsList: tips.length > 0 ? tips : state.tipsList,
        adminQueue:
          queue.length > 0
            ? queue.filter((q) => (q.platform as string) !== 'TikTok Shop')
            : state.adminQueue,
        savedCheckIds: savedState
          ? savedState.savedCheckIds.filter((id) => id !== 'chk_cupmat_001')
          : state.savedCheckIds,
        savedAt: savedState ? savedState.savedAt : state.savedAt,
      };
    });
  },

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

  setSellerPortalTab: (tab) => {
    set({ sellerPortalTab: tab, currentScreen: 'seller-dash' });
    syncUrlParams('seller-dash', get().currentSubTab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  setAdminConsoleTab: (tab) => {
    set({ adminConsoleTab: tab, currentScreen: 'admin-dash' });
    syncUrlParams('admin-dash', get().currentSubTab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  submitReportToAdminQueue: async (input) => {
    const created = await createAdminQueueItemOnServer(input);
    const fallbackItem: AdminQueueItem = created ?? {
      id: `adm_${Date.now().toString(36)}`,
      productTitle: input.productTitle.trim(),
      subtitle: input.subtitle?.trim() || input.flagReason.trim(),
      platform: input.platform,
      flagReason: input.flagReason.trim(),
      reportsCount: 1,
      priceAnomaly:
        input.priceAnomaly?.trim() ||
        (input.reportCategory === 'complaint'
          ? 'Order / Fulfillment Issue'
          : 'Community Flagged'),
      reportedDate: 'Reported Just Now',
      reportCategory: input.reportCategory ?? 'report',
      thumbnailUrl: input.thumbnailUrl,
      illustrationKey: input.illustrationKey ?? 'bag',
      sourceUrl: input.sourceUrl?.trim() || undefined,
      status: input.reportCategory === 'complaint' ? 'pending' : 'under_review',
    };

    set((state) => ({
      adminQueue: [fallbackItem, ...state.adminQueue],
    }));

    get().showToast(
      input.reportCategory === 'complaint'
        ? 'Submitted buyer complaint to Trust & Safety Queue'
        : 'Submitted listing report to Trust & Safety Queue'
    );
    return fallbackItem;
  },

  login: async (email, password) => {
    set({ authLoading: true });
    try {
      const session = await loginWithPassword(email, password);
      if (!session.user) {
        throw new Error('Unable to load user profile.');
      }
      invalidateClientCache('/api/seller');
      invalidateClientCache('/api/admin');
      const savedState = await fetchSavedChecksState();
      const user = session.user;
      set((state) => ({
        authLoading: false,
        isAuthenticated: true,
        authUser: user,
        role: user.role,
        userName: user.fullName,
        userEmail: user.email,
        connectedShop: user.connectedShop,
        savedCheckIds: savedState ? savedState.savedCheckIds : state.savedCheckIds,
        savedAt: savedState ? savedState.savedAt : state.savedAt,
      }));
      if (user.role === 'seller') {
        get().navigateTo('seller-dash');
      } else if (user.role === 'admin') {
        get().navigateTo('admin-dash');
      } else {
        get().navigateTo('home');
      }
      get().showToast(`Signed in as ${user.fullName}`);
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  register: async (params) => {
    set({ authLoading: true });
    try {
      const session = await registerAccount(params);
      if (!session.user) {
        throw new Error('Unable to create account.');
      }
      invalidateClientCache('/api/seller');
      invalidateClientCache('/api/admin');
      const savedState = await fetchSavedChecksState();
      const user = session.user;
      set({
        authLoading: false,
        isAuthenticated: true,
        authUser: user,
        role: user.role,
        userName: user.fullName,
        userEmail: user.email,
        connectedShop: user.connectedShop,
        savedCheckIds: savedState ? savedState.savedCheckIds : [],
        savedAt: savedState ? savedState.savedAt : {},
      });
      if (user.role === 'seller') {
        get().navigateTo('seller-dash');
      } else {
        get().navigateTo('home');
      }
      get().showToast(`Account created for ${user.fullName}`);
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  connectShop: async (input) => {
    set({ authLoading: true });
    try {
      const platform = typeof input === 'string' ? input : input.platform;
      const wasAuthenticated = get().isAuthenticated;
      const session = await connectShopAccount(input);
      if (!session.user) {
        throw new Error('Unable to connect marketplace account.');
      }
      const savedState = await fetchSavedChecksState();
      const user = session.user;
      set((state) => ({
        authLoading: false,
        isAuthenticated: true,
        authUser: user,
        role: user.role,
        userName: user.fullName,
        userEmail: user.email,
        connectedShop: user.connectedShop,
        savedCheckIds: savedState ? savedState.savedCheckIds : state.savedCheckIds,
        savedAt: savedState ? savedState.savedAt : state.savedAt,
      }));
      if (!wasAuthenticated) {
        if (user.role === 'seller') {
          get().navigateTo('seller-dash');
        } else {
          get().navigateTo('home');
        }
      }
      get().showToast(`Connected ${platform} Shop Account for ${user.fullName}`);
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  loginWithGoogle: async (credential, role = 'user') => {
    set({ authLoading: true });
    try {
      const session = await loginWithGoogleToken(credential, role);
      if (!session.user) {
        throw new Error('Unable to sign in with Google right now.');
      }
      const savedState = await fetchSavedChecksState();
      const user = session.user;
      set((state) => ({
        authLoading: false,
        isAuthenticated: true,
        authUser: user,
        role: user.role,
        userName: user.fullName,
        userEmail: user.email,
        connectedShop: user.connectedShop,
        savedCheckIds: savedState ? savedState.savedCheckIds : state.savedCheckIds,
        savedAt: savedState ? savedState.savedAt : state.savedAt,
      }));
      if (user.role === 'seller') {
        get().navigateTo('seller-dash');
      } else if (user.role === 'admin') {
        get().navigateTo('admin-dash');
      } else {
        get().navigateTo('home');
      }
      get().showToast(`Signed in with Google as ${user.fullName}`);
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  requestPasswordReset: async (email) => {
    set({ authLoading: true });
    try {
      const result = await requestPasswordResetCode(email);
      set({ authLoading: false });
      return result;
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  resetPassword: async (params) => {
    set({ authLoading: true });
    try {
      const session = await resetPasswordWithCode(params);
      if (!session.user) {
        throw new Error('Unable to reset password.');
      }
      const savedState = await fetchSavedChecksState();
      const user = session.user;
      set((state) => ({
        authLoading: false,
        isAuthenticated: true,
        authUser: user,
        role: user.role,
        userName: user.fullName,
        userEmail: user.email,
        connectedShop: user.connectedShop,
        savedCheckIds: savedState ? savedState.savedCheckIds : state.savedCheckIds,
        savedAt: savedState ? savedState.savedAt : state.savedAt,
      }));
      get().navigateTo('home');
      get().showToast('Password updated and signed in');
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ authLoading: true });
    try {
      const res = await changeAccountPassword({ currentPassword, newPassword });
      set({ authLoading: false });
      get().showToast(res.message);
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ authLoading: true });
    await logoutAccount();
    invalidateClientCache('/api/seller');
    invalidateClientCache('/api/admin');
    const currentScreen = get().currentScreen;
    set({
      authLoading: false,
      isAuthenticated: false,
      authUser: null,
      role: 'user',
      userName: 'Guest',
      userEmail: '',
      connectedShop: 'Guest Session',
      savedCheckIds: [],
      savedAt: {},
    });
    if (currentScreen === 'seller-dash' || currentScreen === 'admin-dash') {
      get().navigateTo('home');
    }
    get().showToast('Logged out of BudolCheck');
  },

  updateUserProfile: async (name, email, shop) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (get().isAuthenticated) {
      try {
        const res = await patchUserProfileOnServer({
          fullName: trimmedName || undefined,
          email: trimmedEmail || undefined,
          connectedShop: shop?.trim() || undefined,
        });
        if (res.user) {
          set({
            authUser: res.user,
            userName: res.user.fullName,
            userEmail: res.user.email,
            connectedShop: res.user.connectedShop,
          });
          get().showToast('Account profile updated');
          return;
        }
      } catch (err) {
        get().showToast(err instanceof Error ? err.message : 'Unable to update profile');
        return;
      }
    }

    set((state) => ({
      userName: trimmedName || state.userName,
      userEmail: trimmedEmail || state.userEmail,
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

  runKeywordSearch: async (query, platform) => {
    const clean = query.trim();
    if (!clean) return;
    const activePlatform = platform ?? get().searchPlatformFilter ?? 'all';
    set({
      isSearchingCatalog: true,
      searchQuery: clean,
      searchPlatformFilter: activePlatform,
      linkError: null,
    });
    const results = await searchMarketplaceListings(clean, activePlatform);
    set({
      searchResults: results,
      isSearchingCatalog: false,
    });
    if (get().currentScreen !== 'home') {
      get().navigateTo('home');
    }
  },

  setSearchPlatformFilter: async (platform) => {
    const query = get().searchQuery;
    if (!query) {
      set({ searchPlatformFilter: platform });
      return;
    }
    await get().runKeywordSearch(query, platform);
  },

  clearSearchResults: () => {
    set({
      searchResults: null,
      searchQuery: '',
      searchPlatformFilter: 'all',
    });
  },

  selectCatalogListingForCheck: async (catalogId) => {
    set({ isLoadingCheck: true, linkError: null });
    const record = await createCheckFromCatalogId(catalogId);
    if (!record) {
      set({
        isLoadingCheck: false,
        linkError: 'Unable to load that catalog listing right now. Please try again.',
      });
      return;
    }

    const reviewsPageData = await fetchPaginatedReviews(record.id, 'all', 1, 2);
    invalidateClientCache('/api/checks');
    set((state) => {
      const filteredExisting = state.historyChecks.filter((item) => item.id !== record.id);
      return {
        activeCheckId: record.id,
        activeCheck: record,
        hasListing: true,
        isLoadingCheck: false,
        reviewsFilter: 'all',
        reviewsPage: 1,
        paginatedReviews: reviewsPageData,
        historyChecks: [record, ...filteredExisting],
      };
    });
    get().navigateTo('product', 'overview');
    get().showToast(`Loaded verification report for "${record.productTitle}"`);
  },

  runLinkAnalysis: async (rawInput) => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      set({
        linkError:
          'Enter a product keyword to search across stores, or paste a marketplace product link.',
      });
      return false;
    }

    const detection = detectLink(trimmed);
    if (detection.kind === 'invalid') {
      set({ linkError: INVALID_LINK_MESSAGE });
      return false;
    }

    if (detection.kind === 'keyword') {
      await get().runKeywordSearch(trimmed, 'all');
      return true;
    }

    set({ isLoadingCheck: true, linkError: null });
    const baseRecord = await analyzeProductInput(trimmed);
    const isSocial = detection.kind === 'social';
    const analyzedRecord: ProductCheckRecord = {
      ...baseRecord,
      sourceUrl: isSocial ? trimmed : baseRecord.sourceUrl,
      importedFrom: isSocial ? detection.label : baseRecord.importedFrom,
      uploadedImageUrl: undefined,
    };
    const reviewsPageData = await fetchPaginatedReviews(
      analyzedRecord.id,
      'all',
      1,
      2
    );
    set((state) => {
      const filteredExisting = state.historyChecks.filter(
        (item) => item.id !== analyzedRecord.id
      );
      return {
        activeCheckId: analyzedRecord.id,
        activeCheck: analyzedRecord,
        hasListing: true,
        isLoadingCheck: false,
        reviewsFilter: 'all',
        reviewsPage: 1,
        paginatedReviews: reviewsPageData,
        historyChecks: [analyzedRecord, ...filteredExisting],
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
    const record: ProductCheckRecord = {
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
    if (!targetId.startsWith('chk_upload_')) {
      void toggleSavedCheckOnServer(targetId);
    }
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
    void patchAdminQueueStatus(itemId, status);
    const labelMap: Record<AdminReportStatus, string> = {
      pending: 'Marked report as Pending',
      under_review: 'Marked report as Under Review',
      investigating: 'Marked report as Investigating',
      resolved: 'Marked report as Resolved',
      flagged: 'Listing confirmed as high-risk scam',
      dismissed: 'Report dismissed by moderator',
    };
    get().showToast(labelMap[status]);
  },

  showToast: (message) => {
    set({ toastMessage: message });
  },

  clearToast: () => {
    set({ toastMessage: null });
  },
}));
