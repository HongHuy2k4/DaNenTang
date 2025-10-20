// app/(tabs)/gallery.tsx
import { useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { CameraNote } from './index'; // Import kiểu dữ liệu từ màn hình camera

export default function GalleryScreen() {
  const [notes, setNotes] = useState<CameraNote[]>([]);
  const isFocused = useIsFocused(); // Hook để biết khi nào màn hình được focus

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem('camera_notes');
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes).reverse()); // Hiển thị cái mới nhất lên đầu
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  // Tự động load lại ghi chú mỗi khi người dùng quay lại tab này
  useState(() => {
    if(isFocused) {
      loadNotes();
    }
  });

  const deleteNote = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xoá ghi chú này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        onPress: async () => {
          const updatedNotes = notes.filter((note) => note.id !== id);
          await AsyncStorage.setItem('camera_notes', JSON.stringify(updatedNotes));
          setNotes(updatedNotes); // Cập nhật lại UI
        },
        style: 'destructive',
      },
    ]);
  };

  const editCaption = (id: string) => {
    const noteToEdit = notes.find(note => note.id === id);
    Alert.prompt(
      'Sửa Caption',
      'Nhập caption mới:',
      async (newCaption) => {
        if (newCaption) {
          const updatedNotes = notes.map((note) =>
            note.id === id ? { ...note, caption: newCaption } : note
          );
          await AsyncStorage.setItem('camera_notes', JSON.stringify(updatedNotes));
          setNotes(updatedNotes);
        }
      },
      'plain-text',
      noteToEdit?.caption // Giá trị mặc định là caption cũ
    );
  };
  
  const saveToMediaLibrary = async (uri: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền để lưu ảnh.');
          return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Thành công', 'Đã lưu ảnh vào thư viện.');
    } catch (error) {
        Alert.alert('Lỗi', 'Không thể lưu ảnh.');
    }
  };

  const shareImage = async (uri: string) => {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Lỗi', 'Chức năng chia sẻ không có sẵn trên thiết bị này.');
        return;
      }
      await Sharing.shareAsync(uri);
  };


  const renderItem = ({ item }: { item: CameraNote }) => (
    <View style={styles.noteContainer}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <Text style={styles.caption}>{item.caption}</Text>
      <View style={styles.actionsContainer}>
          <Button title="Sửa" onPress={() => editCaption(item.id)} />
          <Button title="Lưu vào máy" onPress={() => saveToMediaLibrary(item.uri)} />
          <Button title="Chia sẻ" onPress={() => shareImage(item.uri)} />
          <TouchableOpacity onPress={() => deleteNote(item.id)}>
              <Text style={styles.deleteText}>Xoá</Text>
          </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {notes.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có ghi chú nào.</Text>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: 'gray',
  },
  noteContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  caption: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  deleteText: {
      color: 'red',
      fontWeight: 'bold',
  }
});