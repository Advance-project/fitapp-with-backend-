import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { isAdminAuthenticated } from "./userStore";

const DUMMY_USERS = [
  "Devanshu",
  "Margin",
  "Harsh",
  "Andrew",
  "Neha",
  "Yogesh",
  "Sahil",
  "Jasdeep",
  "Karan",
  "Anjali",
  "Mohit",
  "Isha",
];

export default function AdminUsers() {
  const navigation = useNavigation<any>();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
    }
  }, [navigation]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DUMMY_USERS;
    return DUMMY_USERS.filter((name) => name.toLowerCase().includes(s));
  }, [q]);

  const buildUserObject = (name: string) => {
    const safe = name.toLowerCase().replace(/\s+/g, "");

    
    const createdAt = new Date("2026-01-25T10:15:00.000Z").toISOString();
    const lastLoginAt = new Date("2026-01-30T14:20:00.000Z").toISOString();

    const seed = safe.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const age = 18 + (seed % 20);
    const height = 155 + (seed % 35);
    const weight = 55 + (seed % 40);

    const objectId = (
      seed.toString(16).padStart(6, "0") +
      "a1b2c3d4e5f6a7b8c9d0e1f2"
    ).slice(0, 24);

    const bcryptShort =
      "$2b$10$" + (safe + "yy").slice(0, 22) + "AbC";

    const email = name === "Devanshu" ? "devanshu@gmail.com" : `${safe}@example.com`;

    return {
      _id: objectId,
      email: email,
      username: safe,
      password_hash: bcryptShort,
      role: name === "Devanshu" ? "admin" : "user",
      is_active: true,
      created_at: createdAt,
      last_login_at: lastLoginAt,
      profile: {
        age: age,
        height_cm: height,
        weight_kg: weight,
        sex: seed % 2 === 0 ? "male" : "female",
        goal:
          seed % 3 === 0
            ? "lose_fat_gain_muscle"
            : seed % 3 === 1
            ? "gain_muscle"
            : "weight_loss",
      },
      preferences: {
        units: "metric",
        privacy: { store_chat_history: seed % 2 === 0 },
      },
    };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>All Users</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search username"
            placeholderTextColor="#9aa3af"
            style={styles.search}
          />

          
          <View style={styles.listBox}>
            {filtered.map((name, idx) => (
              <TouchableOpacity
                key={`${name}-${idx}`}
                style={styles.row}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("AdminUserDetails", {
                    user: buildUserObject(name),
                  })
                }
              >
                <Text style={styles.rowText}>{name}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}

            {filtered.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No users found.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  screen: { flex: 1 },

  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  headerLeft: { width: 44, height: 36, justifyContent: "center" },
  backArrow: { fontSize: 26, color: "#111827", fontWeight: "600" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#111827" },
  headerRight: { width: 44 },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  search: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
  },

  listBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    overflow: "hidden",
  },

  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: { fontSize: 16, fontWeight: "800", color: "#0b1220" },
  chevron: { fontSize: 26, color: "#9aa6b2", paddingLeft: 12 },

  emptyRow: { paddingVertical: 18, paddingHorizontal: 16 },
  emptyText: { color: "#6b7280", fontWeight: "800" },
});
