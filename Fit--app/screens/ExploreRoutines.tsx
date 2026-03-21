import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { globalTemplatesApi, GlobalTemplate, workoutApi, WorkoutTemplate } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList, "ExploreRoutines">;

type ExploreTemplate = {
  id: string;
  name: string;
  target_muscle: string;
  exercises: Array<{ id: string; name: string; muscle: string }>;
  source: "global" | "created";
};

function mapCreatedTemplate(template: WorkoutTemplate): ExploreTemplate {
  const firstMuscle = template.exercises[0]?.muscle ?? "Custom";
  return {
    id: `created-${template.id}`,
    name: template.name,
    target_muscle: firstMuscle,
    exercises: template.exercises,
    source: "created",
  };
}

function mapGlobalTemplate(template: GlobalTemplate): ExploreTemplate {
  return {
    id: `global-${template.id}`,
    name: template.name,
    target_muscle: template.target_muscle,
    exercises: template.exercises,
    source: "global",
  };
}

function shortTargetMuscle(label: string): string {
  const map: Record<string, string> = {
    "Chest": "C",
    "Back": "B",
    "Shoulder": "S",
    "Bicep / Back": "Bi/B",
    "Chest / Tricep": "C/Tri",
    "Shoulder / Abs": "S/Abs",
    "Chest / Back / Shoulder / Bicep / Tricep": "UB (C/B/S/Bi/Tri)",
    "Chest / Shoulder / Tricep": "Push (C/S/Tri)",
    "Back / Bicep / Shoulder": "Pull (B/Bi/S)",
  };
  return map[label] ?? label;
}

export default function ExploreRoutines() {
  const navigation = useNavigation<Nav>();
  const [templates, setTemplates] = useState<ExploreTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      setLoading(true);

      (async () => {
        try {
          const [globalResult, createdResult] = await Promise.allSettled([
            globalTemplatesApi.getAll(),
            workoutApi.getTemplates(),
          ]);

          if (!active) return;

          const globalRows =
            globalResult.status === "fulfilled" ? globalResult.value : [];
          const createdRows =
            createdResult.status === "fulfilled" ? createdResult.value : [];

          const globalMapped = globalRows.map(mapGlobalTemplate);
          const createdMapped = createdRows.map(mapCreatedTemplate);
          const globalNames = new Set(globalMapped.map((row) => row.name.trim().toLowerCase()));

          // Avoid duplicate cards when names match between admin/global and created templates.
          const uniqueCreated = createdMapped.filter(
            (row) => !globalNames.has(row.name.trim().toLowerCase())
          );

          setTemplates([...globalMapped, ...uniqueCreated]);

          if (globalResult.status === "rejected" && createdResult.status === "rejected") {
            const globalError = globalResult.reason;
            setError(
              globalError instanceof Error
                ? globalError.message
                : "Failed to load routines."
            );
          } else if (globalResult.status === "fulfilled" && createdResult.status === "rejected") {
            // Global templates loaded successfully, so keep screen usable without token noise.
            setError("");
          } else {
            setError("");
          }
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

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

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#0b1220" />
          ) : templates.length === 0 ? (
            <Text style={styles.emptyText}>No routines available yet.</Text>
          ) : (
            templates.map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.9}
                style={styles.programCard}
                onPress={() =>
                  navigation.navigate("Program", {
                    programId: p.id,
                    title: p.name,
                    subtitle: String(p.exercises.length),
                    targetMuscle: p.target_muscle,
                    exercises: p.exercises,
                  })
                }
              >
                <View style={styles.programThumb}>
                  <Text style={styles.programThumbText} numberOfLines={1} ellipsizeMode="tail">
                    {shortTargetMuscle(p.target_muscle)}
                  </Text>
                </View>

                <View style={{ flex: 1, justifyContent: "center" }}>
                  <Text style={styles.programTitle}>{p.name}</Text>
                  <Text style={styles.programSub}>
                    {p.exercises.length} exercise{p.exercises.length === 1 ? "" : "s"} • {p.source === "global" ? "Global" : "Created"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {error ? <Text style={styles.emptyText}>{error}</Text> : null}

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
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  programThumb: {
    width: 120,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  programThumbText: {
    fontWeight: "900",
    color: "#1e88e5",
    textAlign: "center",
    fontSize: 13,
  },

  programTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0b1220",
  },

  programSub: {
    marginTop: 6,
    color: "#6b7280",
    fontWeight: "700",
    fontSize: 13,
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

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
});