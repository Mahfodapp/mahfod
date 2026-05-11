export type RootStackParamList = {
  AuthScreen: undefined;
  AppStack: undefined;
  MainTabs: undefined;
  AddMemoScreen: { memoId?: string } | undefined;
  MemoLibraryScreen: undefined;
  ReviewSessionScreen: { memoId?: string } | undefined;
  LearningSessionScreen: { memoId?: string } | undefined;
  MohkamSessionScreen: undefined;
  SettingsScreen: undefined;
  AddNoterBookScreen: undefined;
  MemoViewScreen: { memoId: string };
  NoterDetailScreen: { bookId: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  QuranTab: undefined;
  CenterFabPlaceholder: undefined;
  NoterTab: undefined;
  ToolsTab: undefined;
};
