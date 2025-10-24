import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Post = {
  id: string;
  text: string;
  emojis: string[];
  createdAt: number;
  edited?: boolean;
};

const STORAGE_KEY = "@silentcircle_posts";
const REQUESTS_KEY = "@silentcircle_requests";

const MOOD_MAP: { [key: string]: string[] } = {
  happy: ["😀", "😊", "😄", "🌞", "🎉"],
  joy: ["😁", "✨"],
  excited: ["🤩", "🥳"],
  good: ["😃", "👍"],
  sad: ["😢", "😭", "🌧️"],
  down: ["😞", "🥀"],
  depressed: ["😔", "💧"],
  tired: ["😴", "🥱", "💤"],
  sleep: ["🌙", "🛌"],
  exhausted: ["😫"],
  lazy: ["🙃"],
  angry: ["😠", "😡", "🔥"],
  mad: ["😤"],
  frustrated: ["😣", "🤯"],
  rage: ["💢"],
  lonely: ["😔", "🌙"],
  alone: ["🥺"],
  isolated: ["🌌"],
  anxious: ["😟", "😰", "🤯"],
  nervous: ["😬"],
  worried: ["🤔", "🙁"],
  stress: ["😓", "💦"],
  calm: ["😌", "🌿", "🍵"],
  relaxed: ["🛀", "🌊"],
  peaceful: ["☮️", "🌸"],
  chill: ["🧘‍♂️"],
  love: ["❤️", "💕", "💖"],
  caring: ["🤗"],
  grateful: ["🙏", "🌷"],
  thankful: ["🌼"],
  hopeful: ["🌈", "⭐"],
  bored: ["🥱", "😐"],
  confused: ["😕", "🤔"],
};

const pickRandom = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

const getEmojisForMood = (text: string): string[] => {
  const lower = text.toLowerCase();
  let found: string[] = [];
  for (const [keyword, emojis] of Object.entries(MOOD_MAP)) {
    if (lower.includes(keyword)) {
      found.push(pickRandom(emojis));
    }
  }
  if (found.length === 0) return ["🌸"];
  return Array.from(new Set(found));
};

export default function SilentCircle() {
  const [mood, setMood] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setPosts(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load posts", err);
      }
    };
    loadPosts();
  }, []);

  useEffect(() => {
    const savePosts = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      } catch (err) {
        console.error("Failed to save posts", err);
      }
    };
    if (posts.length > 0) savePosts();
  }, [posts]);

  const addPost = () => {
    if (mood.trim().length > 0) {
      const emojis = getEmojisForMood(mood);
      const newPost: Post = {
        id: Date.now().toString(),
        text: mood,
        emojis,
        createdAt: Date.now(),
        edited: false,
      };
      setPosts([newPost, ...posts]);
      setMood("");
      console.log("📩 New Post:", newPost.text, newPost.emojis.join(" "));
    }
  };

  const clearPosts = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setPosts([]);
      console.log("🧹 Cleared all posts");
    } catch (err) {
      console.error("Failed to clear posts", err);
    }
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editingId) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === editingId
            ? {
                ...post,
                text: editText,
                emojis: getEmojisForMood(editText),
                edited: true,
              }
            : post
        )
      );
      console.log("✏️ Edited Post:", editText);
      setEditingId(null);
      setEditText("");
    }
  };

  const handleDoubleTapDelete = (id: string) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      Alert.alert("Delete Post?", "Are you sure you want to delete this post?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setPosts((prev) => prev.filter((p) => p.id !== id));
            console.log("🗑️ Deleted Post:", id);
          },
        },
      ]);
    }
    lastTapRef.current = now;
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const requestNewFeeling = async () => {
    Alert.prompt(
      "Request New Feeling",
      "Type the emotion or feeling you'd like added:",
      async (text) => {
        if (text?.trim()) {
          try {
            const saved = await AsyncStorage.getItem(REQUESTS_KEY);
            const existing = saved ? JSON.parse(saved) : [];
            const newRequest = {
              id: Date.now().toString(),
              feeling: text.trim(),
              createdAt: Date.now(),
            };
            const updated = [newRequest, ...existing];
            await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
            console.log("📩 New Feeling Request:", text);
            Alert.alert("Thank you!", "Your request has been noted 💌");
          } catch (err) {
            console.error("Failed to save request", err);
          }
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌙 Silent Circle</Text>

      <TextInput
        style={styles.input}
        placeholder="How are you feeling?"
        value={mood}
        onChangeText={setMood}
      />

      <Button title="Share" onPress={addPost} />

      <View style={{ marginTop: 10, marginBottom: 20 }}>
        <Button color="red" title="Clear All Posts" onPress={clearPosts} />
      </View>

      <FlatList
        style={styles.list}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Text style={styles.emoji}>
              {Array.isArray(item.emojis) ? item.emojis.join(" ") : "🌸"}
            </Text>
            {editingId === item.id ? (
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={editText}
                  onChangeText={setEditText}
                />
                <Button title="Save" onPress={saveEdit} />
              </View>
            ) : (
              <TouchableOpacity
                style={{ flex: 1 }}
                onLongPress={() => startEditing(item.id, item.text)}
                onPress={() => handleDoubleTapDelete(item.id)}
              >
                <Text style={styles.postText}>
                  {item.text}
                  {item.edited && (
                    <Text style={styles.editedText}> (edited)</Text>
                  )}
                </Text>
                <Text style={styles.timestamp}>
                  {formatTime(item.createdAt)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Request New Feelings" onPress={requestNewFeeling} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  list: { marginTop: 20 },
  post: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emoji: { fontSize: 24, marginRight: 12, flexShrink: 0 },
  postText: { fontSize: 16, marginBottom: 4 },
  editedText: { fontSize: 14, color: "#999" },
  timestamp: { fontSize: 12, color: "#666" },
});
