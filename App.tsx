import React, { useEffect, useState } from 'react';
import {
  Button,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

const SERVER_URL = 'ws://172.28.3.63:8080'; // Substitua pelo IP do servidor

export default function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    requestPermissions();
    connectWebSocket();
    setupAudioRecord();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
      console.log('🎤 Permissões:', granted);
    }
  };

  const setupAudioRecord = () => {
    const options = {
      sampleRate: 16000,  // Compatível com Web Audio API
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // MIC
      wavFile: 'test.wav',
    };
    AudioRecord.init(options);
  };

  const connectWebSocket = () => {
    const socket = new WebSocket(SERVER_URL);
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      console.log('✅ Conectado ao WebSocket');
      setWs(socket);
    };

    socket.onmessage = (e) => {
      console.log('📥 Mensagem recebida:', e.data);
    };

    socket.onerror = (e) => {
      console.log('❌ Erro WebSocket:', e.message);
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket desconectado');
    };
  };

  const startRecording = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('❗ WebSocket não conectado');
      return;
    }

    console.log('🎙️ Iniciando gravação...');
    setRecording(true);
    try {
      AudioRecord.start();
    } catch (e) {
      console.error('Erro ao iniciar gravação:', e);
    }

    AudioRecord.on('data', (data: string) => {
      const audioBuffer = Buffer.from(data, 'base64'); // PCM linear
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(audioBuffer);
        console.log('📤 Enviado:', audioBuffer.length, 'bytes');
      }
    });
  };

  const stopRecording = () => {
    console.log('🛑 Parando gravação...');
    setRecording(false);
    AudioRecord.stop();
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>🎧 App de Áudio</Text>
      <View style={{ flexDirection: 'row', gap: 20 }}>
        <Button title="Gravar" onPress={startRecording} disabled={recording} />
        <Button title="Parar" onPress={stopRecording} disabled={!recording} />
      </View>
    </SafeAreaView>
  );
}
