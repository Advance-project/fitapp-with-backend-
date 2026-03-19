import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BarChart } from "react-native-chart-kit";
import { isAdminAuthenticated } from "./userStore";
import { adminApi, AdminUserGrowthStats } from "../services/api";

const screenWidth = Dimensions.get("window").width;
const CHART_WIDTH = screenWidth - 56;
const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function getYAxisSegments(values: number[]): number {
  // Keep Y-axis tick distance at exactly 1 unit: 0,1,2,3...
  return Math.max(...values, 1);
}

export default function AdminStatistics() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<AdminUserGrowthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUserGrowthStats();
      setStats(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
      return;
    }
    loadStats();
  }, [navigation, loadStats]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdminAuthenticated()) {
        return;
      }
      loadStats();
    }, [loadStats])
  );

  const resolvedStats: AdminUserGrowthStats =
    stats ?? {
      total_users: 0,
      new_users_this_week: 0,
      new_users_last_week: 0,
      weekly_change: 0,
      weekly_signups_last_week: [0, 0, 0, 0, 0, 0, 0],
      weekly_signups_this_week: [0, 0, 0, 0, 0, 0, 0],
    };

  const growthDiff = useMemo(() => {
    return resolvedStats.weekly_change;
  }, [resolvedStats]);

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(11, 18, 32, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    propsForLabels: {
      fontSize: 11,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#0b1220",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#e5e7eb",
    },
    fillShadowGradient: "#0b1220",
    fillShadowGradientOpacity: 0.08,
    barPercentage: 0.55,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>App-wide statistics</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>Growth overview</Text>

          {loading && !stats && (
            <View style={styles.feedbackRow}>
              <ActivityIndicator color="#1e88e5" />
            </View>
          )}

          {!loading && error && (
            <View style={styles.feedbackRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total users</Text>
              <Text style={styles.statValue}>{resolvedStats.total_users}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>This week</Text>
              <Text style={styles.statValue}>{resolvedStats.new_users_this_week}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Last week</Text>
              <Text style={styles.statValue}>{resolvedStats.new_users_last_week}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Weekly change</Text>
              <Text style={styles.statValue}>
                {growthDiff >= 0 ? `+${growthDiff}` : growthDiff}
              </Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>New users last week</Text>
            <BarChart
              data={{
                labels: DAY_LABELS,
                datasets: [
                  {
                    data: resolvedStats.weekly_signups_last_week,
                  },
                ],
              }}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              fromZero
              segments={getYAxisSegments(resolvedStats.weekly_signups_last_week)}
              withInnerLines
              showValuesOnTopOfBars
              style={styles.chart}
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>New users this week</Text>
            <BarChart
              data={{
                labels: DAY_LABELS,
                datasets: [
                  {
                    data: resolvedStats.weekly_signups_this_week,
                  },
                ],
              }}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              segments={getYAxisSegments(resolvedStats.weekly_signups_this_week)}
              chartConfig={chartConfig}
              fromZero
              withInnerLines
              showValuesOnTopOfBars
              style={styles.chart}
            />
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: { width: 44 },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  feedbackRow: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },

  errorText: {
    color: "#e53935",
    fontWeight: "700",
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0b1220",
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  statCard: {
    width: "48.5%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    padding: 16,
  },

  statLabel: {
    color: "#6b7280",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 8,
  },

  statValue: {
    color: "#0b1220",
    fontWeight: "900",
    fontSize: 26,
  },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginTop: 14,
  },

  chartTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0b1220",
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  chart: {
    borderRadius: 16,
  },
});