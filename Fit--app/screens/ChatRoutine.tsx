import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { aiApi } from "../services/api";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
};

export default function ChatRoutine() {
  const navigation = useNavigation<any>();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m1",
      role: "assistant",
      text: "Hi! Tell me your goal (gain muscle / lose weight), your equipment (gym / home), and how many days per week you want.",
      createdAt: Date.now(),
    },
  ]);

  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState("");

  const listRef = useRef<FlatList<Msg> | null>(null);
  const canSend = useMemo(() => input.trim().length > 0 && !loadingAI, [input, loadingAI]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const history = messages
      .slice(-6)
      .map((message) => ({ role: message.role, content: message.text }));

    const userMsg: Msg = {
      id: `u_${Date.now()}`,
      role: "user",
      text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoadingAI(true);

    try {
      // Try AI response first
      const response = await aiApi.routine(
        text,
        history,
      );

      const botMsg: Msg = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: response.assistant,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "AI request failed.";
      console.log("AI failed:", msg);
      setError(msg);

      const botMsg: Msg = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: "I could not fetch a GPT response right now. Please check your OpenAI quota/billing, then try again.",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Routine Assistant</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {error !== "" && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <FlatList
            ref={(r) => {
              listRef.current = r;
            }}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isUser = item.role === "user";
              return (
                <View style={[styles.bubbleWrap, isUser ? styles.right : styles.left]}>
                  <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                    <Text style={[styles.bubbleText, isUser ? styles.userText : styles.botText]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your request..."
              placeholderTextColor="#9aa3af"
              style={styles.input}
              multiline
            />

            <TouchableOpacity
              onPress={send}
              activeOpacity={0.9}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              disabled={!canSend}
            >
              <Text style={styles.sendText}>{loadingAI ? "..." : "Send"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  screen: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: { width: 44, height: 36, justifyContent: "center" },
  backArrow: { fontSize: 26, color: "#111827", fontWeight: "600" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: { width: 44 },

  list: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },

  bubbleWrap: { marginBottom: 12, maxWidth: "85%" },
  left: { alignSelf: "flex-start" },
  right: { alignSelf: "flex-end" },

  bubble: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  userBubble: { backgroundColor: "#1e88e5" },
  botBubble: { backgroundColor: "#f3f4f6" },

  bubbleText: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  userText: { color: "#fff" },
  botText: { color: "#111827" },

  inputRow: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },

  sendBtn: {
    backgroundColor: "#1e88e5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  errorContainer: {
    backgroundColor: "#fee2e2",
    padding: 10,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
});
