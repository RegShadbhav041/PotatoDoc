// Support screen: the farmer's half of the ticket chat.
//
// Three views in one overlay — list -> thread, list -> new ticket — driven by
// the useTickets hook owned in App.js, so state survives opening the About
// overlay mid-conversation. Signed-out callers get the sign-in gate instead
// of the list (tickets are bearer-only).
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { relativeTime } from "../utils/relativeTime";

function errText(e) {
  if (!e?.response) return "Can't reach the server. Check your connection.";
  const detail = e.response.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  return "Something went wrong. Please try again.";
}

const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.page },
    headRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 10,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    headTitle: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "800",
      color: C.ink,
      letterSpacing: -0.2,
      flex: 1,
    },
    scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
    newBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: C.primary,
      borderRadius: 14,
      paddingVertical: 13,
      marginBottom: 14,
    },
    newBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    bannerText: { flex: 1, fontSize: 13, fontWeight: "600", color: C.gray },
    bannerRetry: { fontSize: 13, fontWeight: "800", color: C.primary },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginBottom: 10,
    },
    ticketTop: { flexDirection: "row", alignItems: "center", gap: 8 },
    ticketSubject: {
      flex: 1,
      fontSize: 15,
      fontWeight: "800",
      color: C.ink,
    },
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
    },
    chipOpen: { backgroundColor: C.leafBg, borderColor: C.primary },
    chipResolved: { backgroundColor: C.leafBg, borderColor: C.cardBorder },
    chipTextOpen: { fontSize: 11, fontWeight: "800", color: C.primary },
    chipTextResolved: { fontSize: 11, fontWeight: "800", color: C.gray },
    preview: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      color: C.gray,
      marginTop: 6,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
    },
    meta: { fontSize: 12, fontWeight: "600", color: C.gray },
    metaDot: { fontSize: 12, color: C.gray },
    chev: { marginLeft: "auto" },
    empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 12 },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: C.leafBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    emptyTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
    emptyBody: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500",
      color: C.gray,
      textAlign: "center",
      marginTop: 6,
    },
    center: { paddingVertical: 40, alignItems: "center" },
    formLabel: {
      fontSize: 13,
      fontWeight: "800",
      color: C.ink,
      marginBottom: 6,
      marginTop: 14,
    },
    input: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 9,
      fontSize: 14,
      fontWeight: "500",
      color: C.ink,
    },
    inputArea: { minHeight: 120, textAlignVertical: "top" },
    errText: {
      fontSize: 13,
      fontWeight: "600",
      color: C.earlyText || "#EF5350",
      marginTop: 10,
    },
    primaryBtn: {
      backgroundColor: C.primary,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
      marginTop: 16,
    },
    primaryBtnDisabled: { opacity: 0.55 },
    primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
    ghostBtn: { paddingVertical: 12, alignItems: "center", marginTop: 4 },
    ghostBtnText: { fontSize: 14, fontWeight: "700", color: C.gray },
    threadHead: { paddingHorizontal: 16, paddingTop: 8 },
    threadSubject: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "800",
      color: C.ink,
      letterSpacing: -0.2,
      marginTop: 10,
    },
    threadMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    resolvedNote: {
      fontSize: 12,
      fontWeight: "600",
      color: C.gray,
      marginTop: 8,
    },
    msgScroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    bubbleWrap: { marginBottom: 12 },
    bubbleWrapMine: { alignItems: "flex-end" },
    bubble: {
      maxWidth: "82%",
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    bubbleAdmin: { backgroundColor: C.card, borderColor: C.cardBorder, alignSelf: "flex-start" },
    bubbleMine: { backgroundColor: C.primary, borderColor: C.primary },
    bubbleAuthor: { fontSize: 11, fontWeight: "800", color: C.gray, marginBottom: 3 },
    bubbleText: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: C.ink },
    bubbleTextMine: { color: "#FFFFFF" },
    bubbleTime: { fontSize: 10, fontWeight: "600", color: C.gray, marginTop: 4 },
    replyBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: C.navBorder || C.cardBorder,
      backgroundColor: C.page,
    },
    replyInput: {
      flex: 1,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 11 : 8,
      fontSize: 14,
      fontWeight: "500",
      color: C.ink,
      maxHeight: 110,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.55 },
    gateCard: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 24,
      alignItems: "center",
      marginTop: 24,
    },
    gateText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      color: C.gray,
      textAlign: "center",
      marginTop: 8,
    },
    gateBtn: {
      backgroundColor: C.primary,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 34,
      marginTop: 16,
    },
    gateBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  });

function StatusChip({ status, s }) {
  const t = useT();
  const open = status !== "resolved";
  return (
    <View style={[s.chip, open ? s.chipOpen : s.chipResolved]}>
      <Text style={open ? s.chipTextOpen : s.chipTextResolved}>
        {open ? t("Open") : t("Resolved")}
      </Text>
    </View>
  );
}

export default function SupportScreen({ tickets, signedIn, onBack, onSignIn }) {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);

  const [view, setView] = useState("list"); // 'list' | 'new' | 'thread'
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState(null);
  const [draft, setDraft] = useState("");
  const [replyError, setReplyError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleOpen = async (id) => {
    setActionError(null);
    try {
      await tickets.open(id);
      setView("thread");
    } catch (e) {
      setActionError(errText(e));
    }
  };

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) {
      setFormError(t("Subject and message are required."));
      return;
    }
    setFormError(null);
    try {
      await tickets.create({ subject: subject.trim(), message: message.trim() });
      setSubject("");
      setMessage("");
      setView("thread");
    } catch (e) {
      setFormError(errText(e));
    }
  };

  const handleReply = async () => {
    const body = draft.trim();
    if (!body) return;
    setReplyError(null);
    try {
      await tickets.reply(body);
      setDraft("");
    } catch (e) {
      setReplyError(errText(e));
    }
  };

  const listBack = () => {
    setActionError(null);
    onBack();
  };

  const header = (title, back) => (
    <View style={s.headRow}>
      <Pressable style={s.backBtn} onPress={back} hitSlop={8}>
        <MaterialIcons name="arrow-back" size={20} color={C.ink} />
      </Pressable>
      <Text style={s.headTitle}>{title}</Text>
    </View>
  );

  if (!signedIn) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        {header(t("Help & Feedback"), onBack)}
        <View style={s.scroll}>
          <View style={s.gateCard}>
            <MaterialIcons name="support-agent" size={34} color={C.primary} />
            <Text style={s.gateText}>
              {t("Sign in to contact support and track your tickets.")}
            </Text>
            <Pressable style={s.gateBtn} onPress={onSignIn}>
              <Text style={s.gateBtnText}>{t("Sign In")}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (view === "thread" && tickets.thread) {
    const thread = tickets.thread;
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <View style={s.threadHead}>
          <View style={[s.headRow, { paddingHorizontal: 0, paddingTop: 0 }]}>
            <Pressable
              style={s.backBtn}
              onPress={() => {
                tickets.close();
                setView("list");
                setReplyError(null);
              }}
              hitSlop={8}
            >
              <MaterialIcons name="arrow-back" size={20} color={C.ink} />
            </Pressable>
            <Text style={s.headTitle}>{t("Ticket")}</Text>
          </View>
          <Text style={s.threadSubject}>{thread.subject}</Text>
          <View style={s.threadMeta}>
            <StatusChip status={thread.status} s={s} />
            <Text style={s.meta}>{relativeTime(thread.updated_at)}</Text>
          </View>
          {thread.status === "resolved" && (
            <Text style={s.resolvedNote}>
              {t("Resolved — sending a message reopens this ticket.")}
            </Text>
          )}
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={90}
        >
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.msgScroll}>
            {(thread.messages || []).map((m) => {
              const mine = m.from === "farmer";
              return (
                <View
                  key={m.id}
                  style={[s.bubbleWrap, mine && s.bubbleWrapMine]}
                >
                  <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleAdmin]}>
                    {!mine && <Text style={s.bubbleAuthor}>{m.author}</Text>}
                    <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>
                      {m.body}
                    </Text>
                    <Text style={[s.bubbleTime, mine && { color: "#E8F5E9" }]}>
                      {relativeTime(m.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })}
            {!!replyError && <Text style={s.errText}>{replyError}</Text>}
          </ScrollView>

          <View style={s.replyBar}>
            <TextInput
              style={s.replyInput}
              value={draft}
              onChangeText={setDraft}
              placeholder={t("Write a reply…")}
              placeholderTextColor={C.gray}
              multiline
            />
            <Pressable
              style={[s.sendBtn, tickets.sending && s.sendBtnDisabled]}
              onPress={handleReply}
              disabled={tickets.sending || !draft.trim()}
            >
              <MaterialIcons name="send" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (view === "new") {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        {header(t("New Ticket"), () => setView("list"))}
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={[s.formLabel, { marginTop: 0 }]}>
            {t("How can we help?")}
          </Text>
          <TextInput
            style={s.input}
            value={subject}
            onChangeText={setSubject}
            placeholder={t("Subject")}
            placeholderTextColor={C.gray}
            maxLength={200}
          />
          <Text style={s.formLabel}>{t("Message")}</Text>
          <TextInput
            style={[s.input, s.inputArea]}
            value={message}
            onChangeText={setMessage}
            placeholder={t("Describe the problem…")}
            placeholderTextColor={C.gray}
            multiline
            maxLength={4000}
          />
          {!!formError && <Text style={s.errText}>{formError}</Text>}
          <Pressable
            style={[s.primaryBtn, tickets.sending && s.primaryBtnDisabled]}
            onPress={handleCreate}
            disabled={tickets.sending}
          >
            <Text style={s.primaryBtnText}>{t("Open Ticket")}</Text>
          </Pressable>
          <Pressable style={s.ghostBtn} onPress={() => setView("list")}>
            <Text style={s.ghostBtnText}>{t("Cancel")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      {header(t("Help & Feedback"), listBack)}
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={tickets.refreshing}
            onRefresh={() => tickets.refresh({ silent: false })}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {!!tickets.error && (
          <View style={s.banner}>
            <MaterialIcons name="cloud-off" size={16} color={C.gray} />
            <Text style={s.bannerText}>{tickets.error}</Text>
            <Pressable onPress={() => tickets.refresh({ silent: false })} hitSlop={8}>
              <Text style={s.bannerRetry}>{t("Retry")}</Text>
            </Pressable>
          </View>
        )}
        {!!actionError && (
          <View style={s.banner}>
            <MaterialIcons name="error-outline" size={16} color={C.gray} />
            <Text style={s.bannerText}>{actionError}</Text>
          </View>
        )}

        <Pressable style={s.newBtn} onPress={() => setView("new")}>
          <MaterialIcons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text style={s.newBtnText}>{t("New Ticket")}</Text>
        </Pressable>

        {tickets.loading ? (
          <View style={s.center}>
            <ActivityIndicator color={C.primary} />
          </View>
        ) : tickets.items.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <MaterialIcons name="support-agent" size={28} color={C.primary} />
            </View>
            <Text style={s.emptyTitle}>{t("No tickets yet")}</Text>
            <Text style={s.emptyBody}>
              {t(
                "Something wrong in the app? Open a ticket and we will help you fix it."
              )}
            </Text>
          </View>
        ) : (
          tickets.items.map((ticket) => (
            <Pressable
              key={ticket.id}
              style={s.card}
              onPress={() => handleOpen(ticket.id)}
            >
              <View style={s.ticketTop}>
                <Text style={s.ticketSubject} numberOfLines={1}>
                  {ticket.subject}
                </Text>
                <StatusChip status={ticket.status} s={s} />
              </View>
              {!!ticket.last_body && (
                <Text style={s.preview} numberOfLines={2}>
                  {ticket.last_body}
                </Text>
              )}
              <View style={s.metaRow}>
                <Text style={s.meta}>{relativeTime(ticket.updated_at)}</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.meta}>
                  {ticket.message_count} {t("messages")}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={18}
                  color={C.gray}
                  style={s.chev}
                />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
