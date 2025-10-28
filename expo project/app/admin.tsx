import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";

const API_URL = "http://localhost:3000"; // Change to your Docker host if needed

interface Post {
  id: number;
  text: string;
  emojis: string[];
  createdAt: number;
  edited?: boolean;
}

interface Request {
  id: number;
  feeling: string;
  createdAt: number;
  reviewed?: boolean;
}

export default function UltimateAdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [showOnlyUnreviewed, setShowOnlyUnreviewed] = useState(true);
  const [searchPost, setSearchPost] = useState("");
  const [searchRequest, setSearchRequest] = useState("");

  /** LOAD DATA */
const loadData = async () => {
  try {
    const [postsRes, requestsRes] = await Promise.all([
      axios.get<Post[]>(`${API_URL}/posts`),
      axios.get<Request[]>(`${API_URL}/requests`),
    ]);
    setPosts(postsRes.data);      // TypeScript now knows this is Post[]
    setRequests(requestsRes.data); // TypeScript now knows this is Request[]
  } catch (err) {
    console.error("Error loading data:", err);
  }
};


  useEffect(() => {
    loadData();
  }, []);

  /** TIME FORMATTER */
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  /** POSTS */
  const deletePost = async (id: number) => {
    Alert.alert("Delete Post?", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/posts/${id}`);
            loadData();
          } catch (err) {
            console.error("Failed to delete post:", err);
          }
        },
      },
    ]);
  };

  const clearPosts = async () => {
    Alert.alert("Clear All Posts?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await Promise.all(posts.map((p) => axios.delete(`${API_URL}/posts/${p.id}`)));
            loadData();
          } catch (err) {
            console.error("Failed to clear posts:", err);
          }
        },
      },
    ]);
  };

  /** REQUESTS */
  const deleteRequest = async (id: number) => {
    Alert.alert("Delete Request?", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/requests/${id}`);
            loadData();
          } catch (err) {
            console.error("Failed to delete request:", err);
          }
        },
      },
    ]);
  };

  const markAsReviewed = async (id: number) => {
    try {
      await axios.put(`${API_URL}/requests/${id}`, { reviewed: true });
      loadData();
    } catch (err) {
      console.error("Failed to mark request reviewed:", err);
    }
  };

  /** FILTERS */
  const filteredPosts = posts
    .filter((p) =>
      p.text.toLowerCase().includes(searchPost.toLowerCase()) ||
      p.emojis.join(" ").includes(searchPost)
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  const filteredRequests = requests
    .filter((r) => (showOnlyUnreviewed ? !r.reviewed : true))
    .filter((r) => r.feeling.toLowerCase().includes(searchRequest.toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt);

  /** EXPORT */
  const exportData = () => {
    let csv = "Type,Text,Emojis,Reviewed,CreatedAt\n";
    filteredPosts.forEach((p) => {
      csv += `Post,"${p.text}","${p.emojis.join(" ")}",,${formatTime(p.createdAt)}\n`;
    });
    filteredRequests.forEach((r) => {
      csv += `Request,"${r.feeling}",,${r.reviewed ? "Yes" : "No"},${formatTime(r.createdAt)}\n`;
    });
    Alert.alert("CSV Export", csv);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.header}>Ultimate Admin Dashboard</Text>

      <View style={{ marginBottom: 10 }}>
        <Button title="Reload Data" onPress={loadData} />
        <Button title="Export to CSV" onPress={exportData} color="#007bff" />
      </View>

      {/* POSTS */}
      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionHeader}>Posts</Text>
        <TextInput
          placeholder="Search posts..."
          value={searchPost}
          onChangeText={setSearchPost}
          style={styles.input}
        />
        <Button title="Clear All Posts" onPress={clearPosts} color="red" />
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onLongPress={() => deletePost(item.id)}>
              <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
              <Text>{item.emojis.join(" ")} {item.text} {item.edited ? "(edited)" : ""}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* REQUESTS */}
      <View style={{ marginTop: 30 }}>
        <Text style={styles.sectionHeader}>Requests</Text>
        <TextInput
          placeholder="Search requests..."
          value={searchRequest}
          onChangeText={setSearchRequest}
          style={styles.input}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Button title="Clear All Requests" onPress={() => requests.forEach(r => deleteRequest(r.id))} color="red" />
          <Button
            title={showOnlyUnreviewed ? "Show All" : "Show Unreviewed"}
            onPress={() => setShowOnlyUnreviewed(!showOnlyUnreviewed)}
          />
        </View>

        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.item, item.reviewed && { backgroundColor: "#e0ffe0" }]}>
              <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
              <Text>{item.feeling}</Text>

              <View style={{ flexDirection: "row", marginTop: 6 }}>
                {!item.reviewed && (
                  <TouchableOpacity style={styles.reviewButton} onPress={() => markAsReviewed(item.id)}>
                    <Text style={{ color: "white" }}>Mark as Reviewed</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.reviewButton, { backgroundColor: "#dc3545", marginLeft: 10 }]} onPress={() => deleteRequest(item.id)}>
                  <Text style={{ color: "white" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  sectionHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  timestamp: { fontSize: 10, color: "#666" },
  reviewButton: {
    padding: 6,
    backgroundColor: "#28a745",
    borderRadius: 4,
    alignItems: "center",
    width: 140,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
});
