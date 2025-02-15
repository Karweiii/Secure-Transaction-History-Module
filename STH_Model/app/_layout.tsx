import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="setpin" options={{ title: "Set PIN" }} />
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="home" options={{ title: "Home" }} />
      <Stack.Screen name="transaction-history" options={{ title: "Transaction History" }} />
      <Stack.Screen name="transaction-detail/[id]" options={{ title: "Transaction Detail" }} />
    </Stack>
  );
}
