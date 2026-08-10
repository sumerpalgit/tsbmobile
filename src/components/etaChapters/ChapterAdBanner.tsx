import React, { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { fetchAdsForChapter } from '../../api/eta';
import type { ChapterAd } from '../../types/etaChapters';

const ROTATE_INTERVAL_MS = 6500;

const DEST_LABEL: Record<string, string> = {
  url: 'Visit our website →',
  calendar: 'Book a meeting →',
  mailto: 'Get in touch →',
};

/** Sponsored ad banner in chapter chat — matches web's `ETABanner.tsx`: real fetch
 * (`GET /ads/eta/:chapterId`), auto-rotates every 6.5s when there's more than one ad, real
 * click-through. Only renders `brandName`/`campaignName` + the banner image — confirmed by a
 * full read of `ETABanner.tsx` that the live banner doesn't render `ad_headline`/`ad_body_text`/
 * `ad_cta_text` at all (those exist on the fuller ad-management type used elsewhere, unused
 * here), so this doesn't fabricate copy the real component never shows. Dismiss is session-local
 * (resets whenever this chapter's chat is reopened), matching web's own per-mount state. */
export function ChapterAdBanner({ chapterId, onCreateAd }: { chapterId: string; onCreateAd: () => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const [ads, setAds] = useState<ChapterAd[]>([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
    setIndex(0);
    fetchAdsForChapter(chapterId)
      .then(setAds)
      .catch(() => setAds([]));
  }, [chapterId]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % ads.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (dismissed || ads.length === 0) return null;
  const ad = ads[index];

  const handlePress = () => {
    if (ad.clickDestinationUrl) Linking.openURL(ad.clickDestinationUrl).catch(() => {});
  };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={handlePress} style={[styles.card, { borderRadius: radius.xl, overflow: 'hidden' }]}>
        {ad.bannerUrl ? (
          <>
            <Image source={{ uri: ad.bannerUrl }} style={styles.bannerImage} resizeMode="cover" />
            <Pressable onPress={() => setDismissed(true)} hitSlop={8} accessibilityLabel="Dismiss ad" style={styles.imageDismissButton}>
              <X size={12} color="#fff" strokeWidth={2} />
            </Pressable>
          </>
        ) : (
          <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.fallbackBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.fallbackTop}>
              <Text style={[fonts.bold, styles.adTag, { color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.12)' }]}>AD</Text>
              <Pressable onPress={() => setDismissed(true)} hitSlop={8} accessibilityLabel="Dismiss ad">
                <X size={11} color="rgba(255,255,255,0.6)" strokeWidth={1.8} />
              </Pressable>
            </View>
            <View style={styles.fallbackBrandRow}>
              <View style={[styles.brandBadge, { backgroundColor: '#fff' }]}>
                <Text style={[fonts.bold, { fontSize: 10, color: colors.feedFill }]}>
                  {ad.brandName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={[fonts.semibold, { fontSize: fontSize.small, color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
                {ad.brandName}
              </Text>
            </View>
            <Text style={[fonts.display, styles.fallbackHeadline, { color: '#fff' }]} numberOfLines={2}>
              {ad.campaignName || ad.brandName}
            </Text>
            <Text style={[fonts.bold, styles.fallbackCta, { color: colors.goldLight }]}>{DEST_LABEL[ad.clickDestinationType] ?? 'Learn more →'}</Text>
          </LinearGradient>
        )}
      </Pressable>
      <View style={styles.footerRow}>
        <Text style={[fonts.bold, styles.sponsoredLabel, { color: colors.ink3 }]}>SPONSORED CONTENT</Text>
        <Pressable onPress={onCreateAd}>
          <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>+ Create Ad</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  card: {
    minHeight: 130,
  },
  bannerImage: {
    width: '100%',
    height: 130,
  },
  imageDismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(9,17,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackBanner: {
    padding: 16,
    paddingBottom: 18,
  },
  fallbackTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adTag: {
    fontSize: 9,
    letterSpacing: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fallbackBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  brandBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackHeadline: {
    fontSize: 19,
    lineHeight: 24,
    marginTop: 10,
    letterSpacing: -0.2,
  },
  fallbackCta: {
    fontSize: 12,
    marginTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sponsoredLabel: {
    fontSize: 9.5,
    letterSpacing: 0.7,
  },
});
