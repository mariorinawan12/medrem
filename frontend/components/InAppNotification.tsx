import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

/* ========= GLOBAL EVENT BUS ========= */
let listener: ((n: NotificationData) => void) | null = null;
let queue: NotificationData[] = [];
let lastKey: string | null = null;
let lastTime = 0;

/* ========= PUBLIC API ========= */
export function triggerInAppNotification(title: string, body: string) {
  if (Platform.OS !== 'web') return;

  const key = `${title}|${body}`;
  const now = Date.now();

  // dedup 2 detik
  if (key === lastKey && now - lastTime < 2000) return;
  lastKey = key;
  lastTime = now;

  const notif: NotificationData = {
    id: `${now}-${Math.random()}`,
    title,
    body,
    timestamp: now,
  };

  if (listener) {
    listener(notif);
  } else {
    queue.push(notif);
  }
}

/* ========= COMPONENT ========= */
export default function InAppNotification() {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-100)).current;
  const isShowing = useRef(false);

  useEffect(() => {
    // 🔒 SINGLE LISTENER GUARD
    if (listener) return;

    listener = show;

    // flush queue
    if (queue.length) {
      const n = queue.shift();
      if (n) show(n);
    }

    return () => {
      listener = null;
    };
  }, []);

  const show = (notif: NotificationData) => {
    if (isShowing.current) {
      queue.push(notif);
      return;
    }

    isShowing.current = true;
    setNotification(notif);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    setTimeout(hide, 4000);
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slide, { toValue: -100, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setNotification(null);
      isShowing.current = false;

      if (queue.length) {
        const next = queue.shift();
        if (next) setTimeout(() => show(next), 300);
      }
    });
  };

  if (!notification || Platform.OS !== 'web') return null;

  return (
    <Animated.View style={[styles.container, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={styles.notification}>
        <Ionicons name="notifications" size={22} color="#4CAF50" />
        <View style={styles.content}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.body}>{notification.body}</Text>
        </View>
        <TouchableOpacity onPress={hide}>
          <Ionicons name="close" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  notification: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  content: { flex: 1 },
  title: { fontWeight: '600', fontSize: 15 },
  body: { fontSize: 13, color: '#666' },
});