import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPin = async () => {
      try {
        const storedPin = await SecureStore.getItemAsync("user_pin");
        if (storedPin) {
          router.replace("/login"); // Redirect to Login if PIN exists
        } else {
          router.replace("/setpin"); // Redirect to PIN Setup if no PIN
        }
      } catch (error) {
        console.error("Error checking PIN:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPin();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null; // Prevent rendering anything visible on this page
}
