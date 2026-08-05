import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { types } from '@react-native-documents/picker';
import { useTheme } from '../../../theme';
import { FileUploadButton } from '../../FileUploadButton';
import { WizardDraft } from './types';

/**
 * Step 4 — cover image. Reuses `FileUploadButton`'s picker flow for the empty dropzone state
 * (its own compact-pill rendering is swapped out here for the mockup's larger dropzone/preview
 * look), and a custom preview card + Remove button once a file is picked, matching the mockup's
 * two states (`cCoverOn`/`cCoverOff`, `myevents_decoded.html` ~line 843).
 */
export function StepCover({ draft, onChange }: { draft: WizardDraft; onChange: (patch: Partial<WizardDraft>) => void }) {
  const { colors, fonts, radius, borderWidth } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionDivider}>
        <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>ADD A COVER IMAGE</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {draft.coverFile ? (
        <View style={[styles.previewCard, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xxl }]}>
          <Image source={{ uri: draft.coverFile.uri }} style={[styles.previewImage, { borderRadius: radius.xl }]} resizeMode="cover" />
          <View style={styles.previewMeta}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[fonts.bold, styles.fileName, { color: colors.ink }]} numberOfLines={1}>
                {draft.coverFile.name}
              </Text>
              {!!draft.coverFile.size && (
                <Text style={[fonts.regular, styles.fileSize, { color: colors.ink3 }]}>{Math.round(draft.coverFile.size / 1024)} KB</Text>
              )}
            </View>
            <Pressable
              onPress={() => onChange({ coverFile: null, coverUrl: '' })}
              style={({ pressed }) => [
                styles.removeButton,
                { backgroundColor: colors.dangerSurface, borderColor: colors.dangerSurface, borderWidth: borderWidth.thin, borderRadius: radius.md },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[fonts.semibold, styles.removeText, { color: colors.danger }]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FileUploadButton
          value={null}
          onChange={file => onChange({ coverFile: file })}
          acceptedTypes={[types.images]}
          placeholder="Drop a cover image or tap to upload"
        />
      )}

      <Text style={[fonts.regular, styles.footnote, { color: colors.ink3 }]}>
        Optional — events without a cover will use a TSB-branded default.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    paddingTop: 17,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  previewCard: {
    padding: 14,
  },
  previewImage: {
    width: '100%',
    height: 158,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  fileName: {
    fontSize: 12.5,
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  removeButton: {
    height: 34,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 12,
  },
  footnote: {
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
