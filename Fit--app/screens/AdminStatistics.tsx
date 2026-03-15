import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { BarChart } from "react-native-chart-kit";
import { isAdminAuthenticated } from "./userStore";

const screenWidth = Dimensions.get("window").width;
const CHART_WIDTH = screenWidth - 56;
const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

type StatsResponse = {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersLastWeek: number;
  weeklySignupsLastWeek: number[];
  weeklySignupsThisWeek: number[];
};

function getYAxisSegments(values: number[]): number {
  // Keep Y-axis tick distance at exactly 1 unit: 0,1,2,3...
  return Math.max(...values, 1);
}

export default function AdminStatistics() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
    }
  }, [navigation]);

  const stats: StatsResponse = {
    totalUsers: 128,
    newUsersThisWeek: 14,
    newUsersLastWeek: 9,
    weeklySignupsLastWeek: [1, 2, 1, 1, 2, 1, 1],
    weeklySignupsThisWeek: [1, 2, 2, 1, 3, 2, 3],
  };

  const growthDiff = useMemo(() => {
    return stats.newUsersThisWeek - stats.newUsersLastWeek;
  }, [stats]);

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

          <View style={styles.row}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total users</Text>
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>This week</Text>
              <Text style={styles.statValue}>{stats.newUsersThisWeek}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Last week</Text>
              <Text style={styles.statValue}>{stats.newUsersLastWeek}</Text>
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
                    data: stats.weeklySignupsLastWeek,
                  },
                ],
              }}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              fromZero
              segments={getYAxisSegments(stats.weeklySignupsLastWeek)}
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
                    data: stats.weeklySignupsThisWeek,
                  },
                ],
              }}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              segments={getYAxisSegments(stats.weeklySignupsThisWeek)}
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