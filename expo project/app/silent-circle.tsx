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
import {
  fetchPosts,
  addPost as apiAddPost,
  deletePost as apiDeletePost,
  fetchRequests,
  addRequest as apiAddRequest,
} from "../lib/api";

type Post = {
  id: string;
  text: string;
  emojis: string[];
  createdAt: number;
  edited?: boolean;
};

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
    if (lower.includes(keyword)) found.push(pickRandom(emojis));
  }
  return found.length > 0 ? Array.from(new Set(found)) : ["🌸"];
};

export default function SilentCircle() {
  const [mood, setMood] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const lastTapRef = useRef<number>(0);

  // Load posts from backend
  const loadPosts = async () => {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err: any) {
      console.error("Failed to load posts", err.message);
      Alert.alert("Error", "Failed to load posts from server");
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Add new post
  const addPost = async () => {
    if (!mood.trim()) return;
    const emojis = getEmojisForMood(mood);
    try {
      const newPost = await apiAddPost(mood, emojis);
      setPosts([newPost, ...posts]);
      setMood("");
    } catch (err: any) {
      console.error("Failed to add post", err.message);
      Alert.alert("Error", "Failed to add post");
    }
  };

  // Delete post
  const deletePost = async (id: string) => {
    try {
      await apiDeletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("Failed to delete post", err.message);
      Alert.alert("Error", "Failed to delete post");
    }
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      // Replace this with backend API call if you implement edit
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, text: editText, emojis: getEmojisForMood(editText), edited: true }
            : p
        )
      );
      setEditingId(null);
      setEditText("");
    } catch (err: any) {
      console.error("Failed to edit post", err.message);
      Alert.alert("Error", "Failed to edit post");
    }
  };

  const handleDoubleTapDelete = (id: string) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      Alert.alert("Delete Post?", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deletePost(id),
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
    return `${Math.floor(hours / 24)}d ago`;
  };

  const requestNewFeeling = async () => {
    Alert.prompt("Request New Feeling", "Type the emotion or feeling you'd like added:", async (text) => {
      if (!text?.trim()) return;
      try {
        await apiAddRequest(text.trim());
        Alert.alert("Thank you!", "Your request has been noted 💌");
      } catch (err: any) {
        console.error("Failed to save request", err.message);
        Alert.alert("Error", "Failed to submit request");
      }
    });
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
        <Button color="red" title="Reload Posts" onPress={loadPosts} />
      </View>

      <FlatList
        style={styles.list}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Text style={styles.emoji}>{item.emojis.join(" ")}</Text>
            {editingId === item.id ? (
              <View style={{ flex: 1 }}>
                <TextInput style={styles.input} value={editText} onChangeText={setEditText} />
                <Button title="Save" onPress={saveEdit} />
              </View>
            ) : (
              <TouchableOpacity style={{ flex: 1 }} onLongPress={() => startEditing(item.id, item.text)} onPress={() => handleDoubleTapDelete(item.id)}>
                <Text style={styles.postText}>{item.text}{item.edited && <Text style={styles.editedText}> (edited)</Text>}</Text>
                <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
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
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 10, backgroundColor: "#fff" },
  list: { marginTop: 20 },
  post: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#fff", borderRadius: 10, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  emoji: { fontSize: 24, marginRight: 12, flexShrink: 0 },
  postText: { fontSize: 16, marginBottom: 4 },
  editedText: { fontSize: 14, color: "#999" },
  timestamp: { fontSize: 12, color: "#666" },
});
