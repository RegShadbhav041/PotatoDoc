import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet, Text, TextInput } from "react-native";

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
import { LanguageProvider } from "./src/i18n";
import { useVideoPlayer, VideoView } from "expo-video";
import * as SplashScreen from "expo-splash-screen";
import { useHistory } from "./src/hooks/useHistory";
import { useAuth } from "./src/hooks/useAuth";
import { useHistorySync } from "./src/hooks/useHistorySync";
import { useNotices } from "./src/hooks/useNotices";

// Hold the native splash (still frame) until the video paints its first
// frame, so launch reads as one continuous animation.
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_MIN_MS = 4000; // one full loop of the 4s video

function Splash({ ready, onDone }) {
  const startedAt = useRef(Date.now()).current;
  const visibleAt = useRef(null); // first video frame — min-time starts HERE,
  // not at mount: the native splash covers us for the first ~1-2s.
  const opacity = useRef(new Animated.Value(1)).current;
  const [frameShown, setFrameShown] = useState(false);
  const player = useVideoPlayer(require("./assets/splash.mp4"), (p) => {
    p.loop = true;
    p.volume = 0; // splash must never make noise (video ships an AAC track)
    p.play(); // expo-video has no autoplay — without this, frame 0 freezes
  });

  const showFirstFrame = useCallback(() => {
    if (!visibleAt.current) visibleAt.current = Date.now();
    setFrameShown(true);
  }, []);

  // Safety net: if the video fails to render, don't trap the user on the
  // native splash — release it (min-time then falls back to mount time).
  useEffect(() => {
    const t = setTimeout(showFirstFrame, 6000);
    return () => clearTimeout(t);
  }, [showFirstFrame]);

  useEffect(() => {
    if (frameShown) SplashScreen.hideAsync().catch(() => {});
  }, [frameShown]);

  useEffect(() => {
    if (!ready || !frameShown) return;
    const sinceVisible = Date.now() - (visibleAt.current || startedAt);
    const wait = Math.max(0, SPLASH_MIN_MS - sinceVisible);
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone();
      });
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, frameShown, startedAt, opacity, onDone]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "#FFFFFF", opacity },
      ]}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        onFirstFrameRender={showFirstFrame}
      />
    </Animated.View>
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
  const [splashGone, setSplashGone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashGone(true), []);
  const { colors: C, isDark } = useTheme();
  const { user, token, ready, signIn, signUp, signOut, clearSession, updateProfile, uploadPhoto, removePhoto } = useAuth();
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

  if (!splashGone) return <Splash ready={ready} onDone={handleSplashDone} />;

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
                    onUploadPhoto={uploadPhoto}
                    onRemovePhoto={removePhoto}
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
});
