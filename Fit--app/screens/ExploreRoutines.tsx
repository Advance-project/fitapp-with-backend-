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
import { globalTemplatesApi, GlobalTemplate } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList, "ExploreRoutines">;

type ExploreTemplate = {
  id: string;
  name: string;
  target_muscle: string;
  exercises: Array<{ id: string; name: string; muscle: string }>;
};

function mapGlobalTemplate(template: GlobalTemplate): ExploreTemplate {
  return {
    id: `global-${template.id}`,
    name: template.name,
    target_muscle: template.target_muscle,
    exercises: template.exercises,
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
          const globalRows = await globalTemplatesApi.getAll();

          if (!active) return;

          const globalMapped = globalRows.map(mapGlobalTemplate);
          setTemplates(globalMapped);
          setError("");
        } catch (loadError) {
          if (!active) return;
          setTemplates([]);
          setError(loadError instanceof Error ? loadError.message : "Failed to load routines.");
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
                    {p.exercises.length} exercise{p.exercises.length === 1 ? "" : "s"} • Global
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

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
});