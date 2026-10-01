import React, { useState } from "react";
import { View, StyleSheet, Text, TextInput } from "react-native";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import HomeScreen from "./src/screens/HomeScreen";
import DiagnoseScreen from "./src/screens/DiagnoseScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import LocationScreen from "./src/screens/LocationScreen";
import AboutScreen from "./src/screens/AboutScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NewsScreen from "./src/screens/NewsScreen";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import BottomNav from "./src/components/BottomNav";
import { ThemeProvider, useTheme } from "./src/theme";
import { LanguageProvider, useT } from "./src/i18n";
import { useHistory } from "./src/hooks/useHistory";
import { useAuth } from "./src/hooks/useAuth";
import { useHistorySync } from "./src/hooks/useHistorySync";
import { useNotices } from "./src/hooks/useNotices";

function Splash({ C }) {
  const t = useT();
  return (
    <View style={[styles.splash, { backgroundColor: C.authBg }]}>
      <Text style={[styles.splashTitle, { color: C.authBtn }]}>PotatoDoc</Text>
      <Text style={[styles.splashSub, { color: C.gray }]}>
        {t("Diagnose. Protect. Grow.")}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppShell />
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null); // 'signin' | 'signup' | 'news' | 'about' | null
  const { colors: C, isDark } = useTheme();
  const { user, token, ready, signIn, signUp, signOut, clearSession, updateProfile } = useAuth();
  const { history, addEntry, clearHistory, replaceHistory, storageBlocked } =
    useHistory();

  useHistorySync({
    token,
    history,
    replaceHistory,
    storageBlocked,
    onUnauthorized: clearSession,
  });

  // Single owner of the feed: the bell badges and the News screen share one
  // unread counter (same rule as useAuth).
  const {
    items: notices,
    unread,
    loading: noticesLoading,
    refreshing: noticesRefreshing,
    error: noticesError,
    refresh: refreshNotices,
    markRead,
    markAllRead,
  } = useNotices(token);

  if (!ready) return <Splash C={C} />;

  const historyLocked = !token;

  const goSignIn = () => setOverlay("signin");
  const goSignUp = () => setOverlay("signup");
  const openNews = () => setOverlay("news");
  const openAbout = () => setOverlay("about");
  const closeOverlay = () => setOverlay(null);

  const changeTab = (next) => {
    setTab(next);
    // Tapping History while signed out opens the gate instead of a dead tab.
    if (next === "history" && historyLocked) setOverlay("signin");
  };

  const handleSignOut = () => {
    signOut();
    setTab("home");
  };

  const signedInHome = (
    <HomeScreen
      user={user}
      unread={unread}
      onScan={() => setTab("diagnose")}
      onSignIn={goSignIn}
      onSignOut={handleSignOut}
      onOpenNews={openNews}
      onOpenLocation={() => setTab("location")}
      onOpenHistory={() => setTab("history")}
    />
  );

  const newsOverlay = (
    <NewsScreen
      notices={notices}
      unread={unread}
      loading={noticesLoading}
      refreshing={noticesRefreshing}
      error={noticesError}
      onRefresh={() => refreshNotices({ silent: false })}
      onMarkRead={(notice) => markRead(notice.id)}
      onMarkAllRead={markAllRead}
      onBack={closeOverlay}
    />
  );

  return (
    <PaperProvider
      theme={{
        ...DefaultTheme,
        dark: isDark,
        colors: {
          ...DefaultTheme.colors,
          primary: C.primary,
          accent: C.accent,
          background: C.page,
          surface: C.card,
          text: C.ink,
          onSurface: C.ink,
        },
      }}
    >
      <SafeAreaProvider>
        <View style={[styles.root, { backgroundColor: C.page }]}>
          <View style={styles.screen}>
            {overlay === "signin" ? (
              <SignInScreen
                signIn={signIn}
                gate={tab === "history"}
                onBack={closeOverlay}
                onSuccess={() => {
                  closeOverlay();
                  // Re-open History only if that is what triggered the gate.
                  if (tab === "history") setTab("history");
                }}
                onGoToSignUp={goSignUp}
              />
            ) : overlay === "signup" ? (
              <SignUpScreen
                signUp={signUp}
                onBack={closeOverlay}
                onSuccess={closeOverlay}
                onGoToSignIn={goSignIn}
              />
            ) : overlay === "news" ? (
              newsOverlay
            ) : overlay === "about" ? (
              <AboutScreen onBack={closeOverlay} />
            ) : (
              <>
                {tab === "home" && signedInHome}
                {tab === "diagnose" && (
                  <DiagnoseScreen
                    addEntry={addEntry}
                    onOpenNews={openNews}
                    unread={unread}
                  />
                )}
                {tab === "history" && historyLocked && (
                  <SignInScreen
                    signIn={signIn}
                    gate
                    onBack={() => setTab("home")}
                    onSuccess={() => setTab("history")}
                    onGoToSignUp={goSignUp}
                  />
                )}
                {tab === "history" && !historyLocked && (
                  <HistoryScreen
                    history={history}
                    onClear={clearHistory}
                    onOpenNews={openNews}
                    unread={unread}
                  />
                )}
                {tab === "location" && <LocationScreen />}
                {tab === "profile" && (
                  <ProfileScreen
                    user={user}
                    historyCount={history.length}
                    unread={unread}
                    onSignIn={goSignIn}
                    onSignOut={handleSignOut}
                    onOpenNews={openNews}
                    onOpenAbout={openAbout}
                    onSaveProfile={updateProfile}
                  />
                )}
              </>
            )}
          </View>
          <BottomNav active={tab} onChange={changeTab} />
        </View>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  splashTitle: { fontSize: 30, fontWeight: "800" },
  splashSub: { marginTop: 4, fontSize: 14 },
});
