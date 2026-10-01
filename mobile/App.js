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
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import BottomNav from "./src/components/BottomNav";
import { COLORS } from "./src/constants/colors";
import { useHistory } from "./src/hooks/useHistory";
import { useAuth } from "./src/hooks/useAuth";
import { useHistorySync } from "./src/hooks/useHistorySync";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.accent,
  },
};

function Splash() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashTitle}>PotatoDoc</Text>
      <Text style={styles.splashSub}>Diagnose. Protect. Grow.</Text>
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null); // 'signin' | 'signup' | null
  const { user, token, ready, signIn, signUp, signOut, clearSession } = useAuth();
  const { history, addEntry, clearHistory, replaceHistory, storageBlocked } =
    useHistory();

  useHistorySync({
    token,
    history,
    replaceHistory,
    storageBlocked,
    onUnauthorized: clearSession,
  });

  if (!ready) return <Splash />;

  const historyLocked = !token;

  const goSignIn = () => setOverlay("signin");
  const goSignUp = () => setOverlay("signup");
  const closeOverlay = () => setOverlay(null);

  const changeTab = (next) => {
    setTab(next);
    // Tapping History while signed out opens the gate instead of a dead tab.
    if (next === "history" && historyLocked) setOverlay("signin");
  };

  const signedInHome = (
    <HomeScreen
      user={user}
      onScan={() => setTab("diagnose")}
      onSignIn={goSignIn}
      onSignOut={() => {
        signOut();
        setTab("home");
      }}
    />
  );

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <View style={styles.root}>
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
            ) : (
              <>
                {tab === "home" && signedInHome}
                {tab === "diagnose" && <DiagnoseScreen addEntry={addEntry} />}
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
                  <HistoryScreen history={history} onClear={clearHistory} />
                )}
                {tab === "location" && <LocationScreen />}
                {tab === "about" && <AboutScreen />}
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
  root: { flex: 1, backgroundColor: COLORS.page },
  screen: { flex: 1 },
  splash: {
    flex: 1,
    backgroundColor: COLORS.authBg,
    alignItems: "center",
    justifyContent: "center",
  },
  splashTitle: { fontSize: 30, fontWeight: "800", color: COLORS.authBtn },
  splashSub: { marginTop: 4, fontSize: 14, color: COLORS.gray },
});
