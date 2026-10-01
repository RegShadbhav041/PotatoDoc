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

export default function SignUpScreen({ signUp, onBack, onSuccess, onGoToSignIn }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return setError("Enter your name.");
    if (!contact.trim()) return setError("Enter your email or phone.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!agreed) return setError("Please agree to the Terms & Privacy.");

    setBusy(true);
    setError(null);
    try {
      await signUp(contact.trim(), name.trim(), password, { remember: true });
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
            <Text style={s.topTitle}>Create Account</Text>
            <View style={s.backBtn} />
          </View>

          <View style={s.avatarWrap}>
            <Image source={require("../../assets/icon.png")} style={s.avatar} />
          </View>

          <Text style={s.heading}>Join Us !</Text>
          <Text style={s.sub}>Create your account in just a tap.</Text>

          <AuthField
            label="Full Name"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />
          <AuthField
            label="Phone or Email"
            icon="mail-outline"
            value={contact}
            onChangeText={setContact}
            placeholder="Phone or email"
          />
          <AuthField
            label="Password"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Create password"
            secure
          />

          <Pressable style={s.agreeRow} onPress={() => setAgreed((a) => !a)} hitSlop={8}>
            <MaterialIcons
              name={agreed ? "check-circle" : "circle"}
              size={18}
              color={agreed ? COLORS.authBtn : "#9AA79B"}
            />
            {/* Not tappable: there is no Terms page to open yet. */}
            <Text style={s.agreeText}>
              I agree to the friendly <Text style={s.agreeStatic}>Terms & Privacy</Text>
            </Text>
          </Pressable>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={[s.primaryBtn, busy && s.primaryBtnBusy]}
            onPress={submit}
            disabled={busy}
          >
            <Text style={s.primaryBtnText}>
              {busy ? "Please wait…" : "Create account"}
            </Text>
          </Pressable>

          <Pressable onPress={onGoToSignIn} hitSlop={8}>
            <Text style={s.switchLine}>
              Already have an account? <Text style={s.switchLink}>Sign in</Text>
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
  topTitle: { fontSize: 20, fontWeight: "800", color: COLORS.ink },

  avatarWrap: { alignItems: "center", marginTop: 20 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#A8574A",
  },

  heading: {
    marginTop: 16,
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

  agreeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },
  agreeText: { flex: 1, fontSize: 14, color: COLORS.ink },
  agreeStatic: { fontWeight: "700", textDecorationLine: "underline" },

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
