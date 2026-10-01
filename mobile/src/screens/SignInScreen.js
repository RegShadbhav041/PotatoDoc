import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import AuthField from "../components/AuthField";
import { authErrorMessage } from "../hooks/useAuth";

const HEADING_FONT = Platform.select({ ios: "Georgia", android: "serif" });

export default function SignInScreen({
  signIn,
  onBack,
  onSuccess,
  onGoToSignUp,
  gate = false,
}) {
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!contact.trim() || !password) {
      setError("Enter your email or phone and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(contact.trim(), password, { remember });
      onSuccess();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.topBar}>
            <Pressable style={s.backBtn} onPress={onBack} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={20} color={COLORS.ink} />
            </Pressable>
            <View style={s.pill}>
              <Text style={s.pillText}>PotatoDoc</Text>
            </View>
            <View style={s.backBtn} />
          </View>

          <View style={s.avatarWrap}>
            <Image source={require("../../assets/icon.png")} style={s.avatar} />
          </View>

          <Text style={s.heading}>Welcome back!</Text>
          <Text style={s.sub}>
            {gate
              ? "Sign in to see your diagnosis history."
              : "Sign in to check on your plants."}
          </Text>

          <AuthField
            label="Email or Phone"
            icon="mail-outline"
            value={contact}
            onChangeText={setContact}
            placeholder="potato@gmail.com"
          />
          <AuthField
            label="Password"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secure
          />

          <Pressable
            style={s.rememberRow}
            onPress={() => setRemember((r) => !r)}
            hitSlop={8}
          >
            <MaterialIcons
              name={remember ? "check-circle" : "circle"}
              size={18}
              color={remember ? COLORS.authBtn : "#9AA79B"}
            />
            <Text style={s.rememberText}>Remember me</Text>
          </Pressable>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={[s.primaryBtn, busy && s.primaryBtnBusy]}
            onPress={submit}
            disabled={busy}
          >
            <Text style={s.primaryBtnText}>{busy ? "Please wait…" : "Sign In"}</Text>
          </Pressable>

          <Pressable onPress={onGoToSignUp} hitSlop={8}>
            <Text style={s.switchLine}>
              New here? <Text style={s.switchLink}>Create an account 👋</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.authBg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 32 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    backgroundColor: COLORS.authPill,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  pillText: { fontSize: 16, fontWeight: "800", color: COLORS.authBtn },

  avatarWrap: { alignItems: "center", marginTop: 26 },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: "#A8574A",
  },

  heading: {
    marginTop: 18,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: COLORS.authBtn,
    textAlign: "center",
    fontFamily: HEADING_FONT,
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray,
    textAlign: "center",
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  rememberText: { fontSize: 14, fontWeight: "600", color: COLORS.ink },

  error: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#C62828",
  },

  primaryBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.authBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnBusy: { opacity: 0.7 },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },

  switchLine: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: COLORS.gray,
  },
  switchLink: {
    fontWeight: "700",
    color: COLORS.authBtn,
    textDecorationLine: "underline",
  },
});
