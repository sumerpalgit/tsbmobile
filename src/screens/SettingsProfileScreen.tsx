import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { pick, types, isErrorWithCode, errorCodes, keepLocalCopy } from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { Pencil } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useMe } from '../hooks/useMe';
import { ME_QUERY_KEY } from '../api/queryKeys';
import { updateProfile, updateProfileImage, updateCoverImage } from '../api/profile';
import { fetchVisibility, saveVisibility } from '../api/settings';
import { uploadFileDirectToSupabase } from '../api/supabaseDirectUpload';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { SettingsSectionCard } from '../components/settings/SettingsSectionCard';
import { ToggleRow } from '../components/settings/ToggleRow';
import { CityField } from '../components/settings/CityField';
import { Avatar } from '../components/Avatar';
import { DEFAULT_VISIBILITY, VisibilitySettings } from '../types/settings';
import type { AppStackParamList } from '../navigation/types';

const HEADLINE_MAX = 120;
const BIO_MAX = 500;

const VISIBILITY_ROWS: { key: keyof VisibilitySettings; label: string; description: string }[] = [
  { key: 'showInDirectory', label: 'Appear in member Directory', description: 'Other Pro members can find you when browsing the Directory.' },
  { key: 'showInMatches', label: 'Show me in match suggestions', description: 'Let AI Assist surface you to other searchers with compatible criteria.' },
  { key: 'showProBadge', label: 'Display "Pro Member" badge', description: 'Show the gold Pro pill next to your name across the platform.' },
  { key: 'defaultAnonymousPosting', label: 'Default to anonymous when posting', description: 'Hides your name on new posts. You can always toggle this per-post.' },
  { key: 'indexForSearchEngines', label: 'Index profile for search engines', description: 'Allow Google and other engines to surface your public profile.' },
];

type ProfileSnapshot = { name: string; headline: string; bio: string; city: string };

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

/** Picks a single image, copying content:// uris to a real local `file://` path first (same
 * workaround `FileUploadButton.tsx` documents — needed for the direct-to-Supabase upload step
 * below, which reads the file natively rather than through RN's `fetch`). */
async function pickImage(): Promise<{ uri: string; name: string; mimeType: string } | null> {
  const [picked] = await pick({ type: [types.images] });
  let uploadUri = picked.uri;
  try {
    const [copy] = await keepLocalCopy({ files: [{ uri: picked.uri, fileName: picked.name ?? 'photo' }], destination: 'cachesDirectory' });
    if (copy?.status === 'success') uploadUri = copy.localUri;
  } catch {
    // fall back to the original picked uri
  }
  return { uri: uploadUri, name: picked.name ?? 'photo.jpg', mimeType: picked.type ?? 'image/jpeg' };
}

/**
 * Settings' "Profile & Visibility" section — cover/avatar upload (immediate, matching web's
 * `handlePhotoUpload`/`handleCoverUpload`: upload-then-save-URL-then-done, no deferred "save"
 * step like `AdCampaignEditScreen`'s banner), display name/headline/bio/city (deferred, its own
 * Discard/Save bar), and a Visibility card of 5 real toggles (deferred, its own Discard/Save
 * bar) — matches web's two independently-dirty-tracked forms exactly.
 */
function SettingsProfileScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: user } = useMe();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<ProfileSnapshot | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileImg, setProfileImg] = useState('');
  const [coverImg, setCoverImg] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const rawProfile = (user.profile ?? {}) as Record<string, unknown>;
    const next: ProfileSnapshot = {
      name: user.name || String(rawProfile.name ?? ''),
      headline: String(rawProfile.headline ?? ''),
      bio: String(rawProfile.bio ?? ''),
      city: String(rawProfile.city ?? ''),
    };
    setName(next.name);
    setHeadline(next.headline);
    setBio(next.bio);
    setCity(next.city);
    setSavedSnapshot(next);
    setProfileImg(user.profileImg || '');
    setCoverImg(user.coverImg || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isProfileDirty =
    !!savedSnapshot && (name !== savedSnapshot.name || headline !== savedSnapshot.headline || bio !== savedSnapshot.bio || city !== savedSnapshot.city);

  const handleDiscardProfile = () => {
    if (!savedSnapshot) return;
    setName(savedSnapshot.name);
    setHeadline(savedSnapshot.headline);
    setBio(savedSnapshot.bio);
    setCity(savedSnapshot.city);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), bio: bio.trim(), city: city.trim(), headline: headline.trim() });
      Toast.show({ type: 'success', text1: 'Profile updated' });
      setSavedSnapshot({ name, headline, bio, city });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePickPhoto = async () => {
    if (photoUploading) return;
    try {
      const file = await pickImage();
      if (!file) return;
      setPhotoUploading(true);
      const uploaded = await uploadFileDirectToSupabase(file.uri, file.name, file.mimeType, 'profile');
      if (!uploaded) throw new Error('Upload failed');
      await updateProfileImage(uploaded);
      setProfileImg(uploaded);
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      Toast.show({ type: 'success', text1: 'Profile photo updated' });
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      Toast.show({ type: 'error', text1: 'Could not upload photo', text2: extractErrorMessage(err) });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePickCover = async () => {
    if (coverUploading) return;
    try {
      const file = await pickImage();
      if (!file) return;
      setCoverUploading(true);
      const uploaded = await uploadFileDirectToSupabase(file.uri, file.name, file.mimeType, 'cover');
      if (!uploaded) throw new Error('Upload failed');
      await updateCoverImage(uploaded);
      setCoverImg(uploaded);
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      Toast.show({ type: 'success', text1: 'Cover photo updated' });
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      Toast.show({ type: 'error', text1: 'Could not upload cover photo', text2: extractErrorMessage(err) });
    } finally {
      setCoverUploading(false);
    }
  };

  const [visibility, setVisibility] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [savedVisibility, setSavedVisibility] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [visibilityLoading, setVisibilityLoading] = useState(true);
  const [savingVisibility, setSavingVisibility] = useState(false);

  useEffect(() => {
    fetchVisibility()
      .then(v => {
        setVisibility(v);
        setSavedVisibility(v);
      })
      .catch(() => {})
      .finally(() => setVisibilityLoading(false));
  }, []);

  const isVisibilityDirty = (Object.keys(visibility) as (keyof VisibilitySettings)[]).some(key => visibility[key] !== savedVisibility[key]);

  const handleSaveVisibility = async () => {
    setSavingVisibility(true);
    try {
      await saveVisibility(visibility);
      Toast.show({ type: 'success', text1: 'Visibility settings saved' });
      setSavedVisibility(visibility);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    } finally {
      setSavingVisibility(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Profile & Visibility" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SettingsSectionCard
          eyebrow="Public profile"
          title="How others see you"
          description="This information appears on your public profile in the directory."
        >
          <Field label="Cover & profile photo">
            <View style={styles.coverAvatarWrap}>
              <View style={[styles.coverBanner, { backgroundColor: colors.chip, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
                {coverImg && <Image source={{ uri: coverImg }} style={styles.coverImage} resizeMode="cover" />}
                {coverUploading && (
                  <View style={[styles.uploadOverlay, { borderRadius: radius.lg }]}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                <Pressable
                  onPress={handlePickCover}
                  disabled={coverUploading}
                  hitSlop={6}
                  style={({ pressed }) => [styles.coverEditBadge, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin }, pressed && styles.pressed]}
                >
                  <Pencil size={12} color={colors.ink2} strokeWidth={1.8} />
                </Pressable>
              </View>
              <View style={styles.avatarOverlapWrap}>
                <Avatar name={name} imageUri={profileImg} size={60} />
                {photoUploading && (
                  <View style={[styles.uploadOverlay, { borderRadius: 30 }]}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                <Pressable
                  onPress={handlePickPhoto}
                  disabled={photoUploading}
                  hitSlop={6}
                  style={({ pressed }) => [styles.avatarEditBadge, { backgroundColor: colors.gold, borderColor: colors.surface }, pressed && styles.pressed]}
                >
                  <Pencil size={11} color={colors.onGold} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </Field>

          <Field label="Display name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
            />
          </Field>

          <Field label="Headline">
            <TextInput
              value={headline}
              onChangeText={t => setHeadline(t.slice(0, HEADLINE_MAX))}
              placeholder="e.g. ETA Searcher · Software Background · Boston"
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
            />
            <Text style={[fonts.regular, styles.counter, { color: colors.ink3 }]}>{headline.length} / {HEADLINE_MAX}</Text>
          </Field>

          <Field label="Bio / thesis">
            <TextInput
              value={bio}
              onChangeText={t => setBio(t.slice(0, BIO_MAX))}
              placeholder="Tell searchers and targets about yourself…"
              placeholderTextColor={colors.ink3}
              multiline
              textAlignVertical="top"
              style={[fonts.regular, styles.textarea, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
            />
            <Text style={[fonts.regular, styles.counter, { color: colors.ink3 }]}>{bio.length} / {BIO_MAX}</Text>
          </Field>

          <Field label="Location">
            <CityField value={city} onChangeText={setCity} />
          </Field>

          <View
            style={[
              styles.saveBar,
              { backgroundColor: colors.surfaceSunken, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
            ]}
          >
            <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>{isProfileDirty ? 'Unsaved changes' : 'All changes saved'}</Text>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={handleDiscardProfile}
              disabled={!isProfileDirty}
              style={({ pressed }) => [
                styles.smallButton,
                { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin, opacity: isProfileDirty ? 1 : 0.4 },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink2 }]}>Discard</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveProfile}
              disabled={!isProfileDirty || savingProfile}
              style={({ pressed }) => [styles.saveButton, { backgroundColor: '#182E43', borderRadius: radius.lg, opacity: isProfileDirty ? 1 : 0.4 }, pressed && styles.pressed]}
            >
              {savingProfile ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, { fontSize: fontSize.small + 1, color: '#fff' }]}>Save changes</Text>}
            </Pressable>
          </View>
        </SettingsSectionCard>

        <SettingsSectionCard eyebrow="Visibility" title="Who can see what" description="Control how visible you are across the platform.">
          {visibilityLoading ? (
            <ActivityIndicator size="small" color={colors.gold} style={{ marginVertical: 8 }} />
          ) : (
            VISIBILITY_ROWS.map((row, index) => (
              <ToggleRow
                key={row.key}
                label={row.label}
                description={row.description}
                value={visibility[row.key]}
                onValueChange={v => setVisibility(prev => ({ ...prev, [row.key]: v }))}
                last={index === VISIBILITY_ROWS.length - 1}
                switchColor="#182e43"
              />
            ))
          )}

          <View
            style={[
              styles.saveBar,
              { backgroundColor: colors.surfaceSunken, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
            ]}
          >
            <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>{isVisibilityDirty ? 'Unsaved changes' : 'All changes saved'}</Text>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => setVisibility(savedVisibility)}
              disabled={!isVisibilityDirty}
              style={({ pressed }) => [
                styles.smallButton,
                { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin, opacity: isVisibilityDirty ? 1 : 0.4 },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink2 }]}>Discard</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveVisibility}
              disabled={!isVisibilityDirty || savingVisibility}
              style={({ pressed }) => [styles.saveButton, { backgroundColor: '#182E43', borderRadius: radius.lg, opacity: isVisibilityDirty ? 1 : 0.4 }, pressed && styles.pressed]}
            >
              {savingVisibility ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, { fontSize: fontSize.small + 1, color: '#fff' }]}>Save changes</Text>}
            </Pressable>
          </View>
        </SettingsSectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink }]}>{label}</Text>
      {!!hint && <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 3, lineHeight: 15 }]}>{hint}</Text>}
      <View style={{ marginTop: 7 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 13,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 12.5,
  },
  input: {
    height: 44,
    paddingHorizontal: 13,
  },
  textarea: {
    minHeight: 90,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  counter: {
    fontSize: 10.5,
    textAlign: 'right',
    marginTop: 4,
  },
  coverAvatarWrap: {
    width: '100%',
    height: 110,
  },
  coverBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 76,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverEditBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlapWrap: {
    position: 'absolute',
    top: 44,
    left: 14,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,16,24,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bleeds out to the card's own edges (cancels `SettingsSectionCard`'s 16px `padding`) instead
  // of sitting as an inset chip — same fix as `SettingsAccountScreen.tsx`'s identical save bar.
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  smallButton: {
    height: 38,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    height: 38,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});

export default SettingsProfileScreen;
