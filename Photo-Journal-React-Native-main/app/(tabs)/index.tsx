// app/(tabs)/index.tsx
import 'expo-crypto';
import 'react-native-get-random-values';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Sửa 1: Import CameraView
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';

// Định nghĩa kiểu dữ liệu cho một ghi chú
export interface CameraNote {
  id: string;
  uri: string;
  caption: string;
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const cameraRef = useRef<CameraView>(null); // Sửa 2: Cập nhật kiểu cho ref
  const router = useRouter();

  useEffect(() => {
    // Yêu cầu quyền truy cập camera khi component được mount
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    // Quyền camera đang được tải
    return <View />;
  }

  if (!permission.granted) {
    // Quyền camera không được cấp
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true, exif: false };
      const newPhoto = await cameraRef.current.takePictureAsync(options);
      setPhoto(newPhoto);
    }
  };

  const saveNote = async () => {
    if (!photo || !caption) {
      Alert.alert('Lỗi', 'Vui lòng chụp ảnh và nhập caption.');
      return;
    }

    try {
      const newNote: CameraNote = {
        id: uuidv4(), // Tạo ID duy nhất
        uri: photo.uri,
        caption: caption,
      };

      // Lấy danh sách ghi chú hiện có
      const existingNotes = await AsyncStorage.getItem('camera_notes');
      const notes = existingNotes ? JSON.parse(existingNotes) : [];

      // Thêm ghi chú mới vào danh sách
      notes.push(newNote);

      // Lưu lại vào AsyncStorage
      await AsyncStorage.setItem('camera_notes', JSON.stringify(notes));

      Alert.alert('Thành công', 'Đã lưu ghi chú!', [
        {
          text: 'OK',
          onPress: () => {
            setPhoto(null);
            setCaption('');
            router.push('/gallery'); // Chuyển sang tab gallery
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu ghi chú.');
      console.error(e);
    }
  };


  // Nếu đã chụp ảnh, hiển thị màn hình preview và nhập caption
  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <TextInput
          style={styles.input}
          placeholder="Nhập caption..."
          value={caption}
          onChangeText={setCaption}
        />
        <View style={styles.buttonContainer}>
          <Button title="Lưu" onPress={saveNote} />
          <Button title="Chụp lại" onPress={() => setPhoto(null)} color="red" />
        </View>
      </View>
    );
  }

  // Màn hình camera chính
  return (
    <View style={styles.container}>
      {/* Sửa 3: Sử dụng CameraView và prop 'facing' */}
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={takePicture} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  camera: {
    flex: 1,
  },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    margin: 20,
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#ccc',
  },
  preview: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});