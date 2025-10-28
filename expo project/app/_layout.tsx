import { Tabs } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons"; 
import React from "react";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="compass" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="silent-circle"
        options={{
          title: "Silent Circle",
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="chatbubble" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
