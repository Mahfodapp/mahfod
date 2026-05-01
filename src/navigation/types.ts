export type RootStackParamList = {
  AuthScreen: undefined;
  AppStack: undefined;
  AddMemoScreen: { memoId?: string } | undefined;
  MemoLibraryScreen: undefined;
  ReviewSessionScreen: { memoId?: string } | undefined;
  MohkamSessionScreen: undefined;
  SettingsScreen: undefined;
  AddNoterBookScreen: undefined;
  NoterDetailScreen: { bookId: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  QuranTab: undefined;
  CenterFabPlaceholder: undefined;
  NoterTab: undefined;
  ToolsTab: undefined;
};
