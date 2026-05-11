import React from 'react';
import { StyleSheet, View } from 'react-native';

export function AuthGradientBackground() {
  return (
    <>
      <View style={styles.topGlow} />
      <View style={styles.centerGlow} />
      <View style={styles.bottomGlow} />
    </>
  );
}

const styles = StyleSheet.create({
  topGlow: {
    position: 'absolute',
    top: -180,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(204,255,0,0.06)',
  },
  centerGlow: {
    position: 'absolute',
    top: '38%',
    left: -140,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -180,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(204,255,0,0.04)',
  },
});
