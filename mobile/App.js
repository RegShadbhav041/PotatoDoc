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
import BottomNav from "./src/components/BottomNav";
import { COLORS } from "./src/constants/colors";
import { useHistory } from "./src/hooks/useHistory";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.accent,
  },
};

export default function App() {
  const [tab, setTab] = useState("home");
  const { history, addEntry, clearHistory } = useHistory();

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <View style={styles.screen}>
            {tab === "home" && <HomeScreen onScan={() => setTab("diagnose")} />}
            {tab === "diagnose" && <DiagnoseScreen addEntry={addEntry} />}
            {tab === "history" && (
              <HistoryScreen history={history} onClear={clearHistory} />
            )}
            {tab === "location" && <LocationScreen />}
            {tab === "about" && <AboutScreen />}
          </View>
        <BottomNav active={tab} onChange={setTab} />
      </View>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.page },
  screen: { flex: 1 },
});
