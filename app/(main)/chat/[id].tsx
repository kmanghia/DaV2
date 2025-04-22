import React from 'react';
import ChatDetailScreen from '@/screens/chat/chat-detail.screen';
import { useLocalSearchParams } from 'expo-router';

export default function ChatDetailRoute() {
  const params = useLocalSearchParams();
  
  console.log('ChatDetailRoute - Params:', params);
  
  // Extract id and ensure it's a string
  const chatId = params.id ? String(params.id) : undefined;
  console.log('ChatDetailRoute - Extracted chatId:', chatId);
  
  // Pass the chatId as a prop to ChatDetailScreen
  return <ChatDetailScreen chatId={chatId} />;
} 