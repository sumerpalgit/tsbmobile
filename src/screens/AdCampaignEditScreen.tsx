import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { types } from '@react-native-documents/picker';
import { useTheme } from '../theme';
import { useAdCampaign } from '../hooks/useAdCampaign';
import { updateAd } from '../api/adManagement';
import { uploadFileDirectToSupabase } from '../api/supabaseDirectUpload';
import { deriveStatus, STATUS_LABELS } from '../types/adManagement';
import type { AdStatus } from '../types/adManagement';
import { ADVERTISER_TYPES, AUDIENCE_OPTIONS } from '../components/etaChapters/CreateCampaignWizard/types';
import { FileUploadButton } from '../components/FileUploadButton';
import { Field } from '../components/etaChapters/CreateCampaignWizard/StepBrand';
import { FieldSelect } from '../components/events/CreateEventWizard/FieldSelect';
import { DateTimeField } from '../components/events/CreateEventWizard/DateTimeField';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { AdCampaignEditSkeleton } from '../components/adManagement/AdCampaignEditSkeleton';
import { GeographyMultiSelect } from '../components/adManagement/GeographyMultiSelect';
import type { AppStackParamList } from '../navigation/types';
import type { PickedFile } from '../components/FileUploadButton';

const STATUS_OPTIONS = (['active', 'paused', 'review', 'draft', 'ended'] as AdStatus[]).map(s => ({ value: s, label: STATUS_LABELS[s] }));
const TIER_OPTIONS = [
  { value: 'premium', label: 'Premium — Priority slot · 2.5×' },
  { value: 'standard', label: 'Standard — Base rate · 1×' },
];
/** Real edit-page CTA presets (`CTA_PRESETS` in `page.tsx`) — 7 items, one more than the create
 * wizard's 6-item quick-fill chip row ("Schedule Demo" is edit-only). `'__custom__'` opens a free
 * -text field, matching web's real "preset OR custom" toggle exactly — the earlier version was a
 * flat preset-only dropdown with an invented "Visit Site" value that doesn't exist on web, and had
 * no way to represent a legacy/custom CTA at all. */
const CTA_PRESETS = ['Learn More', 'Get Started', 'Book a Call', 'Contact Us', 'Sign Up', 'Apply Now', 'Schedule Demo'];
const CTA_OPTIONS = [...CTA_PRESETS.map(v => ({ value: v, label: v })), { value: '__custom__', label: 'Custom…' }];
/** Real values (`DEST_TYPES` in `page.tsx`) — the earlier version invented `profile`/`chapter`/
 * `email` values that don't exist on the backend; saving with one of those would have written a
 * value real web never produces, and a real `calendar`/`mailto` record loaded from the backend
 * couldn't be represented at all (silently showed the placeholder instead of the true value). */
const DEST_OPTIONS = [
  { value: 'url', label: 'External Website' },
  { value: 'calendar', label: 'Calendar Booking Link' },
  { value: 'mailto', label: 'Email CTA (mailto)' },
  { value: 'custom', label: 'Custom URL' },
];
const DURATION_WEEK_OPTIONS = [1, 2, 4, 8, 12, 16].map(w => ({ value: String(w), label: `${w} week${w === 1 ? '' : 's'}` }));
const ALLOWED_BANNER_MIME = ['image/jpeg', 'image/png', 'image/jpg'];

const HEADLINE_MAX = 80;
const BODY_MAX = 160;

type EditDraft = {
  campaignName: string;
  brandName: string;
  advertiserType: string;
  contactEmail: string;
  status: AdStatus;
  tier: 'standard' | 'premium';
  homeFeed: boolean;
  bannerFile: PickedFile | null;
  /** The real, already-uploaded banner URL — shown as a live preview (matches real web's
   * `bannerPreview` state), separate from `bannerFile` (a freshly picked replacement, not yet
   * uploaded). `null` once "Remove & re-upload" clears it, same as web setting `ad_banner_url` to
   * `""` — that's what tells `handleSave` not to fall back to the old banner. */
  existingBannerUrl: string | null;
  headline: string;
  body: string;
  cta: string;
  destType: string;
  destUrl: string;
  audience: string[];
  geography: string[];
  startDate: string;
  durationWeeks: string;
};

/** Single-form edit screen — matches web's real `manage/[adId]/edit/page.tsx` exactly, NOT the
 * create wizard's step shape (this is a genuinely different flow on real web: one scrollable page
 * of grouped cards, with fields the create form doesn't have — status, Home Feed toggle — and
 * without others it does — no policy checkbox, no ETA-chapter picker, since chapter targeting is
 * uneditable after creation on real web too; plan decision #8). Geography Focus uses
 * `GeographyMultiSelect` (grouped + searchable, matching real web's `SearchableMultiSelect` +
 * `useGeographies()` exactly), a real, broader source than the create wizard's hardcoded 5-value
 * chip list — also faithfully preserved as a real inconsistency, not reconciled. The current
 * banner image is shown as a live preview (matches real web's `bannerPreview`), not just an empty
 * upload placeholder — that was a real gap in the first pass of this screen. */
function AdCampaignEditScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'AdCampaignEdit'>>();
  const { adId } = route.params;

  const { ad, isLoading } = useAdCampaign(adId);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  // Preset vs. free-text CTA — matches web's own `ctaMode` state, including auto-detecting an
  // existing non-preset value on load (e.g. a legacy custom CTA) and switching straight into
  // custom mode for it rather than showing a blank "Select label…".
  const [ctaMode, setCtaMode] = useState<'preset' | 'custom'>('preset');

  useEffect(() => {
    if (ad && !draft) {
      const cta = ad.adCtaText ?? 'Learn More';
      setCtaMode(CTA_PRESETS.includes(cta) ? 'preset' : 'custom');
      setDraft({
        campaignName: ad.campaignName,
        brandName: ad.brandName,
        advertiserType: ad.advertiserType ?? '',
        contactEmail: ad.primaryContactEmail ?? '',
        status: deriveStatus(ad),
        tier: ad.tier ?? 'standard',
        homeFeed: ad.homePlacement,
        bannerFile: null,
        existingBannerUrl: ad.adBannerUrl,
        headline: ad.adHeadline ?? '',
        body: ad.adBodyText ?? '',
        cta,
        destType: ad.clickDestinationType ?? 'url',
        destUrl: ad.clickDestinationUrl ?? '',
        audience: ad.targetAudience,
        geography: ad.targetGeography,
        startDate: ad.campaignStartDate ?? '',
        // Matches web's real default (`Number(ad.campaign_duration_weeks) || 2`) — the earlier
        // `?? 4` fallback didn't match either the real default or a null/zero duration record.
        durationWeeks: String(ad.campaignDurationWeeks || 2),
      });
    }
  }, [ad, draft]);

  const patch = (p: Partial<EditDraft>) => setDraft(prev => (prev ? { ...prev, ...p } : prev));
  const clearError = (key: string) => setErrors(prev => (prev[key] ? { ...prev, [key]: '' } : prev));
  const toggleAudience = (value: string) => {
    if (!draft) return;
    patch({ audience: draft.audience.includes(value) ? draft.audience.filter(v => v !== value) : [...draft.audience, value] });
  };

  const handleSave = async () => {
    if (!draft || !ad || submitting) return;
    const errs: Record<string, string> = {};
    if (!draft.campaignName.trim()) errs.campaignName = 'Campaign name is required.';
    if (!draft.brandName.trim()) errs.brandName = 'Brand name is required.';
    if (!draft.contactEmail.trim()) errs.contactEmail = 'Contact email is required.';
    if (!draft.destUrl.trim()) errs.destUrl = 'Destination URL is required.';
    if (!draft.startDate) errs.startDate = 'Start date is required.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Toast.show({ type: 'error', text1: 'Please fix the highlighted fields' });
      return;
    }

    setSubmitting(true);
    try {
      let bannerUrl = draft.existingBannerUrl ?? '';
      if (draft.bannerFile) {
        const uploaded = await uploadFileDirectToSupabase(
          draft.bannerFile.uri,
          draft.bannerFile.name,
          draft.bannerFile.mimeType ?? 'image/jpeg',
          'ad-banners',
        );
        if (!uploaded) throw new Error('Banner upload failed.');
        bannerUrl = uploaded;
      }

      await updateAd(ad.id, {
        campaign_name: draft.campaignName.trim(),
        brand_name: draft.brandName.trim(),
        advertiser_type: draft.advertiserType,
        primary_contact_email: draft.contactEmail.trim(),
        status: draft.status,
        home_placement: draft.homeFeed,
        tier: draft.tier,
        campaign_start_date: draft.startDate,
        campaign_duration_weeks: Number(draft.durationWeeks) || 1,
        click_destination_type: draft.destType,
        click_destination_url: draft.destUrl.trim(),
        ad_headline: draft.headline.trim(),
        ad_body_text: draft.body.trim(),
        ad_cta_text: draft.cta.trim() || 'Learn More',
        target_audience: draft.audience,
        target_geography: draft.geography,
        ad_banner_url: bannerUrl,
      });

      // Matches web's real post-save behavior — a persistent "Saved — redirecting…" banner, then
      // navigate back after a short delay, rather than a transient toast + an immediate pop that
      // gives no visible confirmation the save actually landed.
      setSaved(true);
      setTimeout(() => navigation.goBack(), 800);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.message || 'Could not save changes' });
      setSubmitting(false);
    }
  };

  if (isLoading || !ad || !draft) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <AdScreenHeader title="Edit campaign" onBack={() => navigation.goBack()} />
        <ScrollView>
          <AdCampaignEditSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Edit campaign" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {saved && (
          <View style={[styles.savedBanner, { backgroundColor: colors.successSurface, borderColor: colors.success, borderRadius: radius.lg }]}>
            <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.success }]}>Saved — redirecting…</Text>
          </View>
        )}

        <SectionCard title="Campaign basics">
          <Field label="Campaign name" required error={errors.campaignName}>
            <TextInput
              value={draft.campaignName}
              onChangeText={t => {
                patch({ campaignName: t });
                clearError('campaignName');
              }}
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
            />
          </Field>
          <Field label="Brand name" required error={errors.brandName}>
            <TextInput
              value={draft.brandName}
              onChangeText={t => {
                patch({ brandName: t });
                clearError('brandName');
              }}
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
            />
          </Field>
          <Field label="Advertiser type">
            <FieldSelect value={draft.advertiserType} placeholder="Select type…" options={ADVERTISER_TYPES} onChange={v => patch({ advertiserType: v })} />
          </Field>
          <Field label="Contact email" required error={errors.contactEmail}>
            <TextInput
              value={draft.contactEmail}
              onChangeText={t => {
                patch({ contactEmail: t });
                clearError('contactEmail');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Status & placement">
          <Field label="Campaign status" hint="Setting to Paused removes it from all carousels immediately.">
            <FieldSelect value={draft.status} placeholder="Select status…" options={STATUS_OPTIONS} onChange={v => patch({ status: v as AdStatus })} />
          </Field>
          <Field label="Banner tier">
            <FieldSelect value={draft.tier} placeholder="Select tier…" options={TIER_OPTIONS} onChange={v => patch({ tier: v as 'standard' | 'premium' })} />
          </Field>
          <Pressable onPress={() => patch({ homeFeed: !draft.homeFeed })} style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>Home Feed placement</Text>
              <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]}>
                Show in the right-rail banner carousel on the home dashboard
              </Text>
            </View>
            <View style={[styles.switchTrack, { backgroundColor: draft.homeFeed ? colors.gold : colors.surfaceSunken, borderRadius: radius.pill }]}>
              <View style={[styles.switchKnob, { borderRadius: radius.pill, transform: [{ translateX: draft.homeFeed ? 18 : 2 }] }]} />
            </View>
          </Pressable>
        </SectionCard>

        <SectionCard title="Creative">
          <Field label="Ad banner" error={errors.banner}>
            {draft.bannerFile || draft.existingBannerUrl ? (
              <View>
                <View style={[styles.bannerFrame, { borderColor: colors.goldLight, backgroundColor: colors.chip, borderRadius: radius.lg }]}>
                  <Image
                    source={{ uri: draft.bannerFile ? draft.bannerFile.uri : draft.existingBannerUrl! }}
                    style={[styles.bannerPreview, { borderRadius: radius.md }]}
                    resizeMode="contain"
                  />
                </View>
                <Pressable onPress={() => patch({ bannerFile: null, existingBannerUrl: null })} hitSlop={6}>
                  <Text style={[fonts.semibold, styles.removeLink, { color: colors.ink3 }]}>Remove &amp; re-upload</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <FileUploadButton
                  value={null}
                  onChange={f => {
                    if (f && f.mimeType && !ALLOWED_BANNER_MIME.includes(f.mimeType)) {
                      setErrors(prev => ({ ...prev, banner: 'Only JPG or PNG allowed.' }));
                      Toast.show({ type: 'error', text1: 'Only JPG or PNG allowed.' });
                      return;
                    }
                    clearError('banner');
                    patch({ bannerFile: f });
                  }}
                  acceptedTypes={[types.images]}
                  placeholder="Tap to upload a banner"
                />
                <Text style={[fonts.regular, styles.hintText, { color: colors.ink3 }]}>PNG, JPG · 260 × 200 px recommended</Text>
              </View>
            )}
          </Field>
          <Field label="Headline" error={errors.headline} hint={`${HEADLINE_MAX - draft.headline.length} characters left.`}>
            <TextInput
              value={draft.headline}
              onChangeText={t => patch({ headline: t.slice(0, HEADLINE_MAX) })}
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
            />
          </Field>
          <Field label="Body copy" hint={`${BODY_MAX - draft.body.length} characters left.`}>
            <TextInput
              value={draft.body}
              onChangeText={t => patch({ body: t.slice(0, BODY_MAX) })}
              multiline
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.textarea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
            />
          </Field>
          <Field label="Call-to-action label" hint="Shown as a button on the ad slide.">
            <View style={styles.ctaRow}>
              <View style={{ flex: 1 }}>
                <FieldSelect
                  value={ctaMode === 'custom' ? '__custom__' : draft.cta}
                  placeholder="Select label…"
                  options={CTA_OPTIONS}
                  onChange={v => {
                    if (v === '__custom__') {
                      setCtaMode('custom');
                    } else {
                      setCtaMode('preset');
                      patch({ cta: v });
                    }
                  }}
                />
              </View>
              {ctaMode === 'custom' && (
                <TextInput
                  value={draft.cta}
                  onChangeText={t => patch({ cta: t.slice(0, 30) })}
                  placeholder="Your custom label"
                  placeholderTextColor={colors.ink3}
                  style={[fonts.regular, styles.input, styles.ctaCustomInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
                />
              )}
            </View>
          </Field>
        </SectionCard>

        <SectionCard title="Click destination">
          <Field label="Destination type">
            <FieldSelect value={draft.destType} placeholder="Select type…" options={DEST_OPTIONS} onChange={v => patch({ destType: v })} />
          </Field>
          <Field label="Destination URL" required error={errors.destUrl}>
            <TextInput
              value={draft.destUrl}
              onChangeText={t => {
                patch({ destUrl: t });
                clearError('destUrl');
              }}
              autoCapitalize="none"
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Targeting">
          <View style={{ gap: 7 }}>
            <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>Audience</Text>
            <View style={styles.chipRow}>
              {AUDIENCE_OPTIONS.map(a => (
                <Chip key={a} label={a} active={draft.audience.includes(a)} onPress={() => toggleAudience(a)} />
              ))}
            </View>
            <Text style={[fonts.regular, styles.hintText, { color: colors.ink3 }]}>
              {draft.audience.length ? `${draft.audience.length} selected` : 'Leave empty to reach all members.'}
            </Text>
          </View>
          <View style={{ gap: 7 }}>
            <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>Geography focus</Text>
            <GeographyMultiSelect selected={draft.geography} onChange={g => patch({ geography: g })} />
            <Text style={[fonts.regular, styles.hintText, { color: colors.ink3 }]}>
              Ads only show to users whose geography focus matches. Leave empty to show to all users.
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Schedule">
          <Field label="Start date" required error={errors.startDate}>
            <DateTimeField
              value={draft.startDate}
              mode="date"
              placeholder="Select a start date"
              onChange={v => {
                patch({ startDate: v });
                clearError('startDate');
              }}
            />
          </Field>
          <Field label="Duration">
            <FieldSelect value={draft.durationWeeks} placeholder="Select duration…" options={DURATION_WEEK_OPTIONS} onChange={v => patch({ durationWeeks: v })} />
          </Field>
        </SectionCard>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={submitting || saved}
          style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}
        >
          <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={submitting || saved}
          style={[styles.saveButton, { backgroundColor: colors.gold, borderRadius: radius.xl, opacity: submitting || saved ? 0.7 : 1 }]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>{saved ? 'Saved ✓' : 'Save changes'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
      <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderRadius: radius.lg },
        active ? { borderColor: colors.goldLight, backgroundColor: colors.chip } : { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 100,
    gap: 13,
  },
  savedBanner: {
    padding: 13,
    borderWidth: 1,
  },
  card: {
    padding: 14,
  },
  hintText: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  ctaCustomInput: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
  },
  cardBody: {
    gap: 13,
    marginTop: 12,
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13.5,
  },
  bannerFrame: {
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 10,
    alignItems: 'center',
  },
  bannerPreview: {
    width: '100%',
    height: 110,
  },
  removeLink: {
    fontSize: 11,
    textDecorationLine: 'underline',
    marginTop: 7,
    alignSelf: 'flex-start',
  },
  textarea: {
    minHeight: 80,
    paddingHorizontal: 12,
    paddingTop: 11,
    borderWidth: 1,
    fontSize: 13.5,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchTrack: {
    width: 40,
    height: 22,
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 18,
    height: 18,
    backgroundColor: '#fff',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    height: 34,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1.5,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdCampaignEditScreen;
