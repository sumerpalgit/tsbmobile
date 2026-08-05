import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';
import { Icon } from '../../icons/Icon';
import { uploadEventCoverImage } from '../../../api/events';
import type { EventFormPayload } from '../../../types/events';
import { StepAudience } from './StepAudience';
import { StepBasics } from './StepBasics';
import { StepCover } from './StepCover';
import { StepReview } from './StepReview';
import { StepWhenWhere } from './StepWhenWhere';
import { EMPTY_WIZARD_DRAFT, STEP_NAMES, WizardDraft, step1Valid, step2Valid } from './types';

/** Builds web's `EventFormPayload` shape from the wizard draft — `fmt` ("Online"/"In
 * Person"/"Hybrid") maps to `event_type`, `etype` (the mockup's Webinar/Workshop/... dropdown)
 * maps to `format`; see `types.ts`'s doc comment for the full field-name rationale. */
function toPayload(draft: WizardDraft, coverUrl: string): EventFormPayload {
  return {
    title: draft.title.trim(),
    event_description: draft.desc.trim(),
    event_type: draft.fmt === 'In Person' ? 'In-person' : draft.fmt,
    format: draft.etype,
    visibility: draft.vis,
    start_date: draft.sdate,
    end_date: draft.edate || draft.sdate,
    start_time: draft.stime,
    end_time: draft.etime,
    timezone: draft.tz,
    event_link: draft.link,
    location: draft.venue,
    rsvp_required: draft.rsvp ? 'yes' : 'no',
    hosted_by: draft.host.trim(),
    cover_image: coverUrl,
  };
}

/**
 * 5-step create/edit-event wizard content — Basics → When & Where → Audience → Cover → Review,
 * matching the mockup's `create`/`cstep` state machine (`myevents_decoded.html` ~line 592-951)
 * for layout. Plain screen content now, not a `Modal` overlay — this used to own its own `Modal`
 * + `Animated.timing` slide-in (matching `FilterPanel.tsx`/`EventDetailView.tsx`'s pattern), but
 * moved to a dedicated pushed screen (`CreateEventScreen.tsx`, registered in `AppNavigator.tsx`)
 * so it gets a real native push transition and back gesture instead of stacking a second `Modal`
 * on top of My Events' own screen. `CreateEventScreen` now owns the safe-area/mount lifecycle;
 * this component just renders the step content, header chrome, and footer nav.
 *
 * Edit reuses this same shell — matches web's own `EventForm`, which is one component for both
 * `handleAddEvent`'s create and edit branches (`my-events/page.tsx`) — triggered from
 * `EventListCard`'s owner-only "Edit" button, pre-filled via `initialDraft`.
 */
export function CreateEventWizard({
  initialDraft,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  /** Pre-fills the draft for editing an existing event; omit to create a new one. */
  initialDraft?: WizardDraft;
  onClose: () => void;
  onSubmit: (payload: EventFormPayload) => Promise<unknown>;
  isSubmitting: boolean;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const isEditing = !!initialDraft;

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(initialDraft ?? EMPTY_WIZARD_DRAFT);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const activeFieldRef = useRef<TextInput | null>(null);

  const patch = (next: Partial<WizardDraft>) => setDraft(prev => ({ ...prev, ...next }));
  const gotoStep = (n: number) => {
    setStep(n);
    scrollYRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  /** Two things were wrong with the previous attempts, in order:
   *   1. `react-native-keyboard-aware-scroll-view`'s automatic focused-input detection didn't
   *      reliably fire.
   *   2. Its replacement, `ScrollView`'s `scrollResponderScrollNativeHandleToKeyboard`, is a
   *      legacy Paper-architecture API built on raw numeric view tags — it silently no-ops here,
   *      confirmed against a screenshot where the keyboard opened with *zero* layout change at
   *      all (not even Android's own `windowSoftInputMode="adjustResize"` compensated, which
   *      normally at least shrinks the window — a known Android edge-to-edge quirk where
   *      `adjustResize` gets ignored).
   *
   * Fixed by not depending on native resize *or* any legacy tag-based measurement at all — this
   * doesn't need `KeyboardAvoidingView` to shrink anything (see its own comment below on why
   * Android stays `behavior={undefined}`, same as `OnboardingScreen.tsx`). Scrolling to the
   * focused field instead uses a real `ref` to that `TextInput`'s `measureInWindow` — not a guess
   * at what a synthetic event's `target` resolves to at runtime (that guess is exactly what broke
   * the previous attempt) — to get its absolute on-screen position, compares that to the
   * keyboard's top edge (`Dimensions.get('window').height - keyboardHeight`), and scrolls by
   * exactly the difference; both measurements are in the same absolute screen-coordinate space, so
   * this works regardless of whether anything else in the tree also resizes. `keyboardDidShow` (not
   * `onFocus`) triggers the actual scroll, since the keyboard's real height isn't known yet at
   * focus time — `onFocus` only records which field's ref is active (each field in
   * `StepBasics`/`StepWhenWhere` owns its own ref and calls `onFieldFocus(ref)` with it). */
  const handleFieldFocus = (ref: React.RefObject<TextInput | null>) => {
    activeFieldRef.current = ref.current;
  };

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', e => {
      const field = activeFieldRef.current;
      if (!field) return;
      field.measureInWindow((_x, y, _w, height) => {
        const keyboardTop = Dimensions.get('window').height - e.endCoordinates.height;
        const buffer = 16;
        const fieldBottom = y + height;
        if (fieldBottom > keyboardTop - buffer) {
          scrollRef.current?.scrollTo({ y: scrollYRef.current + (fieldBottom - (keyboardTop - buffer)), animated: true });
        }
      });
    });
    return () => sub.remove();
  }, []);

  const canNext = step === 1 ? step1Valid(draft) : step === 2 ? step2Valid(draft) : true;
  const onLast = step === 5;

  const handleNext = async () => {
    if (!canNext) {
      Toast.show({ type: 'info', text1: step === 1 ? 'Add a title and description first' : 'Pick a start date and time' });
      return;
    }
    if (!onLast) {
      gotoStep(step + 1);
      return;
    }

    let coverUrl = draft.coverUrl;
    if (draft.coverFile && !coverUrl) {
      setUploading(true);
      try {
        const result = await uploadEventCoverImage(draft.coverFile);
        coverUrl = result.imageUrl;
      } catch {
        setUploading(false);
        Toast.show({ type: 'error', text1: 'Could not upload cover image', text2: 'Please try again.' });
        return;
      }
      setUploading(false);
    }

    try {
      await onSubmit(toPayload(draft, coverUrl));
      onClose();
    } catch {
      // Errors already toasted by useEventMutations' onError.
    }
  };

  const busy = isSubmitting || uploading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}
      // Back to matching `OnboardingScreen.tsx`'s convention (Android `undefined`) — `behavior="height"`
      // stacked on top of Android's `windowSoftInputMode="adjustResize"` is exactly what that file's
      // own comment already warns about: a residual gap under the footer even with no keyboard
      // shown (confirmed — that's what turning it on here actually produced). The scroll-to-field
      // fix below doesn't need `KeyboardAvoidingView` to resize anything to work: it computes the
      // focused field's position and the keyboard's top edge in absolute screen coordinates via
      // `measureInWindow`/`keyboardDidShow`, and scrolls by the difference regardless of whether
      // anything else in the tree also resized.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{isEditing ? 'Edit Event' : 'Create a New Event'}</Text>
            <Text style={[fonts.regular, styles.subtitle, { color: colors.ink3 }]}>Posted to your chapter feed and TSB calendar</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [
              styles.closeButton,
              { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg },
              pressed && styles.pressed,
            ]}
          >
            <Icon name="close" size={14} color={colors.ink2} />
          </Pressable>
        </View>

        <View style={styles.stepsRow}>
          {[1, 2, 3, 4, 5].map(n => {
            const done = n < step;
            const on = n === step;
            return (
              <View key={n} style={[styles.stepWrap, n === 5 && { flex: undefined }]}>
                <View
                  style={[
                    styles.stepDot,
                    { borderRadius: radius.pill, borderWidth: borderWidth.thin },
                    done
                      ? { backgroundColor: colors.gold, borderColor: colors.gold }
                      : on
                      ? { backgroundColor: colors.accentSolid, borderColor: colors.accentSolid }
                      : { backgroundColor: colors.surface2, borderColor: colors.border },
                  ]}
                >
                  <Text style={[fonts.bold, styles.stepDotText, { color: done ? '#fff' : on ? colors.onAccent : colors.ink3 }]}>
                    {done ? '✓' : n}
                  </Text>
                </View>
                {n < 5 && <View style={[styles.stepLine, { backgroundColor: done ? colors.gold : colors.border }]} />}
              </View>
            );
          })}
        </View>
        <View style={styles.stepLabelRow}>
          <Text style={[fonts.bold, styles.stepIndex, { color: colors.gold }]}>STEP {step} OF 5</Text>
          <View style={[styles.stepBullet, { backgroundColor: colors.border }]} />
          <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.ink }]}>{STEP_NAMES[step - 1]}</Text>
        </View>
      </View>

      {/* `keyboardShouldPersistTaps="handled"` so tapping a Format/Timezone/etc. button doesn't
          need a second tap to dismiss the keyboard first — same reasoning as `OnboardingScreen.tsx`. */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={e => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {step === 1 && <StepBasics draft={draft} onChange={patch} onFieldFocus={handleFieldFocus} />}
        {step === 2 && <StepWhenWhere draft={draft} onChange={patch} onFieldFocus={handleFieldFocus} />}
        {step === 3 && <StepAudience draft={draft} onChange={patch} />}
        {step === 4 && <StepCover draft={draft} onChange={patch} />}
        {step === 5 && <StepReview draft={draft} />}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: 16 + insets.bottom }]}>
        <Pressable
          onPress={() => (step === 1 ? onClose() : gotoStep(step - 1))}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl },
            pressed && styles.pressed,
          ]}
        >
          {step !== 1 && (
            <View style={styles.backIcon}>
              <Icon name="chevronRight" size={14} color={colors.ink2} />
            </View>
          )}
          <Text style={[fonts.semibold, styles.backLabel, { color: colors.ink2 }]}>{step === 1 ? 'Cancel' : 'Back'}</Text>
        </Pressable>
        <Pressable
          onPress={handleNext}
          disabled={busy}
          style={({ pressed }) => [
            styles.nextButton,
            { borderRadius: radius.xl, backgroundColor: canNext ? colors.gold : colors.surfaceSunken },
            busy && { opacity: 0.7 },
            !busy && pressed && styles.pressed,
          ]}
        >
          <Text style={[fonts.bold, styles.nextLabel, { color: canNext ? '#fff' : colors.ink3 }]}>
            {busy
              ? isEditing
                ? 'Saving…'
                : 'Posting…'
              : onLast
              ? isEditing
                ? 'Save Changes'
                : 'Create Event'
              : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 13 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 25, lineHeight: 27, letterSpacing: -0.3 },
  subtitle: { fontSize: 11.5, lineHeight: 15, marginTop: 5 },
  closeButton: { width: 34, height: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  stepWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' },
  stepDotText: { fontSize: 11 },
  stepLine: { flex: 1, height: 2, borderRadius: 2, marginHorizontal: 5 },
  stepLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11 },
  stepIndex: { fontSize: 10, letterSpacing: 0.7 },
  stepBullet: { width: 3, height: 3, borderRadius: 1.5 },
  // `paddingBottom` is generous on purpose, not a spacing choice — a `ScrollView` can only ever
  // scroll up to `contentHeight - viewportHeight`, so a field sitting right at the natural end of
  // the content (like Step 2's "Hosted by", the last field) has nowhere further to scroll *into*
  // once the keyboard covers it; extraScrollHeight below can't invent scroll room that doesn't
  // exist. This over-provisions that room so the last field in any step can always be scrolled
  // fully clear of the keyboard.
  body: { paddingHorizontal: 18, paddingBottom: 260 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 11 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 48, paddingHorizontal: 14 },
  backIcon: { transform: [{ scaleX: -1 }] },
  backLabel: { fontSize: 13 },
  nextButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  nextLabel: { fontSize: 14.5 },
  pressed: { opacity: 0.65 },
});
