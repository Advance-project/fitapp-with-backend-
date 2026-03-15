import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

type Nav = NativeStackNavigationProp<RootStackParamList, "ExploreRoutines">;

type ProgramItem = {
  id: string;
  title: string;
  subtitle: string;
};

const PROGRAMS: ProgramItem[] = [
  {
    id: "chest_routine",
    title: "Chest",
    subtitle: "2 exercise",
  },
];

export default function ExploreRoutines() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Explore</Text>

          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Routines</Text>

          {PROGRAMS.map((p) => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.9}
              style={styles.programCard}
              onPress={() =>
                navigation.navigate("Program", {
                  programId: p.id,
                  title: p.title,
                  subtitle: "2",
                })
              }
            >
              <View style={styles.programThumb}>
                <Text style={styles.programThumbText}>{p.title}</Text>
              </View>

              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text style={styles.programTitle}>{p.title}</Text>
                <Text style={styles.programSub}>{p.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 90 }} />
        </ScrollView>
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

  content: { paddingHorizontal: 16, paddingTop: 14 },

  sectionTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0b1220",
    marginBottom: 12,
  },

  programCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },

  programThumb: {
    width: 110,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  programThumbText: {
    fontWeight: "900",
    color: "#1e88e5",
    textAlign: "center",
    fontSize: 18,
  },

  programTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0b1220",
  },

  programSub: {
    marginTop: 10,
    color: "#6b7280",
    fontWeight: "700",
    fontSize: 16,
  },

  bottomTabs: {
    height: 64,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e6ebf2",
    flexDirection: "row",
    alignItems: "center",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  tabIcon: { fontSize: 18 },
  tabTextActive: { fontWeight: "900", color: "#0b1220" },
  tabText: { fontWeight: "700", color: "#6b7280" },
  tabDivider: { width: 1, height: "70%", backgroundColor: "#dfe6f1" },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 18,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d1d5db",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    paddingVertical: 10,
  },

  gridRow: { flexDirection: "row", gap: 12, paddingTop: 8, paddingBottom: 14 },
  gridCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardActive: { borderColor: "#1e88e5" },
  gridIcon: { fontSize: 22, marginBottom: 10 },
  gridText: { fontSize: 16, fontWeight: "800", color: "#111827" },

  clearBtn: { alignSelf: "center", marginTop: 6, paddingVertical: 10, paddingHorizontal: 16 },
  clearText: { color: "#1e88e5", fontWeight: "900" },
});