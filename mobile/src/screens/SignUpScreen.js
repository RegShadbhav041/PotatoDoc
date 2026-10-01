import React, { useMemo, useState } from "react";
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
import { useColors } from "../theme";
import { useT } from "../i18n";
import AuthField from "../components/AuthField";
import { authErrorMessage } from "../hooks/useAuth";

const HEADING_FONT = Platform.select({ ios: "Georgia", android: "serif" });

const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.authBg },
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
      backgroundColor: C.card,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: { fontSize: 20, fontWeight: "800", color: C.ink },

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
      color: C.authBtn,
      textAlign: "center",
      fontFamily: HEADING_FONT,
    },
    sub: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: C.gray,
      textAlign: "center",
    },

    agreeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 18,
    },
    agreeText: { flex: 1, fontSize: 14, color: C.ink },
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
      backgroundColor: C.authAction,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnBusy: { opacity: 0.7 },
    primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },

    switchLine: {
      marginTop: 20,
      textAlign: "center",
      fontSize: 14,
      color: C.gray,
    },
    switchLink: {
      fontWeight: "700",
      color: C.authBtn,
      textDecorationLine: "underline",
    },
  });

export default function SignUpScreen({ signUp, onBack, onSuccess, onGoToSignIn }) {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return setError(t("Enter your name."));
    if (!contact.trim()) return setError(t("Enter your email or phone."));
    if (password.length < 8) return setError(t("Password must be at least 8 characters."));
    if (!agreed) return setError(t("Please agree to the Terms & Privacy."));

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
              <MaterialIcons name="arrow-back" size={20} color={C.ink} />
            </Pressable>
            <Text style={s.topTitle}>{t("Create Account")}</Text>
            <View style={s.backBtn} />
          </View>

          <View style={s.avatarWrap}>
            <Image source={require("../../assets/icon.png")} style={s.avatar} />
          </View>

          <Text style={s.heading}>{t("Join Us !")}</Text>
          <Text style={s.sub}>{t("Create your account in just a tap.")}</Text>

          <AuthField
            label={t("Full Name")}
            icon="person-outline"
            value={name}
            onChangeText={setName}
            placeholder={t("Your name")}
            autoCapitalize="words"
          />
          <AuthField
            label={t("Phone or Email")}
            icon="mail-outline"
            value={contact}
            onChangeText={setContact}
            placeholder={t("Phone or email")}
          />
          <AuthField
            label={t("Password")}
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder={t("Create password")}
            secure
          />

          <Pressable style={s.agreeRow} onPress={() => setAgreed((a) => !a)} hitSlop={8}>
            <MaterialIcons
              name={agreed ? "check-circle" : "circle"}
              size={18}
              color={agreed ? C.authBtn : "#9AA79B"}
            />
            {/* Not tappable: there is no Terms page to open yet. */}
            <Text style={s.agreeText}>
              {t("I agree to the friendly")}{" "}
              <Text style={s.agreeStatic}>{t("Terms & Privacy")}</Text>
            </Text>
          </Pressable>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={[s.primaryBtn, busy && s.primaryBtnBusy]}
            onPress={submit}
            disabled={busy}
          >
            <Text style={s.primaryBtnText}>
              {busy ? t("Please wait…") : t("Create account")}
            </Text>
          </Pressable>

          <Pressable onPress={onGoToSignIn} hitSlop={8}>
            <Text style={s.switchLine}>
              {t("Already have an account?")}{" "}
              <Text style={s.switchLink}>{t("Sign in")}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
