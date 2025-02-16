import React from "react";
import { View, Text, Button, StyleSheet, useWindowDimensions, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375; // Check for small devices (e.g., iPhone SE)
  const isTablet = width >= 768; // Check for tablets

  const styles = makeStyles(width, height, isSmallDevice, isTablet);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Welcome to the App!</Text>
      <Text style={styles.subtitle}>Manage your finances with ease.</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/transaction-history")}
      >
        <Text style={styles.buttonText}>📜 View Transaction History</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (width: number, height: number, isSmallDevice: boolean, isTablet: boolean) => 
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      padding: isTablet ? 40 : isSmallDevice ? 20 : 30,
    },
    title: {
      fontSize: isTablet ? 36 : isSmallDevice ? 24 : 30,
      fontWeight: "bold",
      color: "#333",
      textAlign: "center",
      marginBottom: isTablet ? 20 : isSmallDevice ? 10 : 15,
    },
    subtitle: {
      fontSize: isTablet ? 24 : isSmallDevice ? 16 : 20,
      color: "#666",
      textAlign: "center",
      marginBottom: isTablet ? 40 : isSmallDevice ? 20 : 30,
    },
    button: {
      backgroundColor: "#007AFF",
      paddingVertical: isTablet ? 20 : isSmallDevice ? 12 : 15,
      paddingHorizontal: isTablet ? 40 : isSmallDevice ? 20 : 30,
      borderRadius: isTablet ? 20 : isSmallDevice ? 10 : 15,
      elevation: 3, // Shadow for Android
      shadowColor: "#000", // Shadow for iOS
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    buttonText: {
      fontSize: isTablet ? 24 : isSmallDevice ? 16 : 20,
      color: "#fff",
      fontWeight: "bold",
      textAlign: "center",
    },
  });