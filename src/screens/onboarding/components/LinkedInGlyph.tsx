import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function LinkedInGlyph() {
  return (
    <View style={styles.linkedinGlyph}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>in</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linkedinGlyph: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
