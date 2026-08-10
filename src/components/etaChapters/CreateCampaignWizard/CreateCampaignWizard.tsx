import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Megaphone, X } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { createAdCampaign } from '../../../api/eta';
import { uploadFileDirectToSupabase } from '../../../api/supabaseDirectUpload';
import { StepBrand } from './StepBrand';
import { StepPlacement } from './StepPlacement';
import { StepCreative } from './StepCreative';
import { StepTargeting } from './StepTargeting';
import { StepSchedule } from './StepSchedule';
import { StepReview } from './StepReview';
import { actualDays, EMPTY_DRAFT } from './types';
import type { CampaignDraft } from './types';

const STEP_NAMES = ['Brand', 'Placement', 'Creative', 'Targeting', 'Schedule', 'Review'];
const TOTAL_STEPS = STEP_NAMES.length;

/** "Create Your Campaign" — matches `ETAChapters_decoded.html`'s "CREATE AD" (~line 942) and
 * web's `CreateCampaignModal` exactly (see the ETA Chapters plan's ad-campaign research for the
 * full field/validation/cost-formula spec). Real, working endpoint (`POST /ads/create-ad`), no
 * payment collection anywhere in this flow (`payment_completed: true` is a hardcoded literal web
 * itself sends — not a real charge; replicated faithfully, not newly invented). Validation
 * matches web's own permissiveness exactly: non-empty checks only, no email/URL regex, no
 * file-size enforcement beyond MIME type, no past-date guard — this is not a gap, it's fidelity
 * to the real contract. */
export function CreateCampaignWizard({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setDraft(EMPTY_DRAFT);
    }
  }, [visible]);

  const patch = (p: Partial<CampaignDraft>) => setDraft(prev => ({ ...prev, ...p }));

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!draft.brandName.trim() || !draft.advertiserType || !draft.contactEmail.trim() || !draft.campaignName.trim()) {
        return 'Please fill in all required fields.';
      }
      if (!draft.policyAgreed) return 'You must agree to the TSB Advertising Policies.';
    }
    if (step === 2) {
      const needsEta = draft.placement === 'eta' || draft.placement === 'both';
      if (needsEta && draft.chapterIds.length === 0) return 'Select at least one ETA chapter.';
    }
    if (step === 3) {
      if (!draft.bannerFile) return 'Upload a banner image.';
      if (!draft.headline.trim()) return 'Add a headline.';
      if (!draft.destUrl.trim()) return 'Add a destination URL.';
    }
    if (step === 5) {
      if (!draft.startDate) return 'Select a campaign start date.';
      if (actualDays(draft) < 1) return 'Enter a valid campaign duration.';
    }
    return null;
  };

  const goNext = () => {
    const error = validateStep();
    if (error) {
      Toast.show({ type: 'error', text1: error });
      return;
    }
    if (step === TOTAL_STEPS) {
      handleSubmit();
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!draft.bannerFile) return;
    setSubmitting(true);
    try {
      const bannerUrl = await uploadFileDirectToSupabase(
        draft.bannerFile.uri,
        draft.bannerFile.name,
        draft.bannerFile.mimeType ?? 'image/jpeg',
        'ad-banners',
      );
      if (!bannerUrl) throw new Error('Banner upload failed.');

      await createAdCampaign({
        brand_name: draft.brandName.trim(),
        advertiser_type: draft.advertiserType,
        primary_contact_email: draft.contactEmail.trim(),
        campaign_name: draft.campaignName.trim(),
        home_placement: draft.placement === 'home' || draft.placement === 'both',
        ad_banner_url: bannerUrl,
        click_destination_type: draft.destType,
        click_destination_url: draft.destUrl.trim(),
        campaign_start_date: draft.startDate,
        campaign_duration_weeks: Math.max(1, Math.round(actualDays(draft) / 7)),
        payment_completed: true,
        eta_chapter_ids: draft.chapterIds,
        tier: draft.bannerTier,
        ad_headline: draft.headline.trim(),
        ad_body_text: draft.body.trim(),
        ad_cta_text: draft.ctaLabel.trim() || 'Learn More',
        target_audience: draft.audience,
        target_geography: draft.geography,
      });

      Toast.show({ type: 'success', text1: 'Campaign submitted!', text2: 'It will go live after review.' });
      onClose();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Could not submit campaign', text2: err?.message ?? 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <View style={styles.headerTop}>
            <View style={[styles.headerIconWell, { backgroundColor: colors.feedFill, borderRadius: radius.lg }]}>
              <Megaphone size={16} color={colors.feedOnFill} strokeWidth={1.6} />
            </View>
            <View style={styles.headerText}>
              <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>ADVERTISE ON TSB</Text>
              <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>Create Your Campaign</Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Close" style={[styles.closeButton, { backgroundColor: colors.surfaceSunken }]}>
              <X size={12} color={colors.ink2} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View style={styles.progressRow}>
            <Text style={[fonts.bold, styles.progressLabel, { color: colors.ink3 }]}>STEP {step} OF {TOTAL_STEPS}</Text>
            <Text style={[fonts.bold, styles.progressLabel, { color: colors.goldDark }]}>{STEP_NAMES[step - 1]}</Text>
          </View>
          <View style={styles.progressBar}>
            {STEP_NAMES.map((name, i) => (
              <View key={name} style={[styles.progressSegment, { backgroundColor: i < step ? colors.gold : colors.border }]} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {step === 1 && <StepBrand draft={draft} onChange={patch} />}
          {step === 2 && <StepPlacement draft={draft} onChange={patch} />}
          {step === 3 && <StepCreative draft={draft} onChange={patch} />}
          {step === 4 && <StepTargeting draft={draft} onChange={patch} />}
          {step === 5 && <StepSchedule draft={draft} onChange={patch} />}
          {step === 6 && <StepReview draft={draft} />}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
          {step > 1 && (
            <Pressable
              onPress={() => setStep(s => s - 1)}
              style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>← Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={goNext}
            disabled={submitting}
            style={[styles.nextButton, { backgroundColor: colors.gold, borderRadius: radius.xl, opacity: submitting ? 0.6 : 1 }]}
          >
            <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>
              {submitting ? 'Submitting…' : step === TOTAL_STEPS ? 'Submit Campaign →' : 'Continue →'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 11,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 12,
  },
  headerIconWell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 19,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  body: {
    padding: 16,
    paddingBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 9,
    padding: 16,
  },
  backButton: {
    height: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
