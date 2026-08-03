import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../../../theme';

const THUMB_SIZE = 20;

/** Dual-thumb range slider — Step 4's "Financial Criteria" (Revenue/EBITDA/EV ranges). RN has no
 * built-in range slider (the single-value `@react-native-community/slider` doesn't do dual
 * thumbs), and the design's native dual `<input type="range">` pair is web-only, so this is
 * hand-built: drag math translates horizontal drag distance (against the track's measured width)
 * into a value delta.
 *
 * Built on `react-native-gesture-handler`'s `Gesture.Pan()` (already a dependency — used for the
 * app's drawer swipe), not the legacy `PanResponder` API. A first version used `PanResponder` and
 * never actually dragged on a real device: nested inside the page's scrolling
 * `KeyboardAwareScrollView`, the moment a real touch had any vertical wobble (which every real
 * finger drag has), the parent ScrollView's own responder negotiation reclaimed the gesture —
 * `PanResponder`'s termination flags weren't reliable enough to prevent that. Gesture Handler
 * solves this natively via axis-based activation (`activeOffsetX`/`failOffsetY` below): the
 * *native* recognizer decides, based on the touch's actual direction, whether this gesture or the
 * parent scroll should win, before either side's JS even runs — not a JS-thread negotiation that
 * can lose the race. `.runOnJS(true)` keeps the callbacks as plain JS functions (not
 * UI-thread worklets), so the same ref-based "always read latest props" pattern still applies.
 *
 * Kept prop-driven and option-list-agnostic (label/min/max/step/unit) rather than
 * Revenue-specific, since Step 4 needs three of these (Revenue, EBITDA, EV) with the same
 * behavior and only the bounds differing — see `FINANCIAL_RANGES` in `./constants`. */
export function DualRangeSlider({
  label,
  required,
  min,
  max,
  step,
  unit,
  lo,
  hi,
  onChange,
}: {
  label: string;
  required?: boolean;
  min: number;
  max: number;
  step: number;
  unit: string;
  lo: number;
  hi: number;
  onChange: (lo: number, hi: number) => void;
}) {
  const { colors, fonts } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const loStart = useRef(lo);
  const hiStart = useRef(hi);

  // Gesture callbacks are created once (below, via `useMemo`) but need the *current* lo/hi/bounds
  // on every update event — this ref is refreshed on every render so they never read stale props.
  const latest = useRef({ lo, hi, min, max, step, onChange });
  latest.current = { lo, hi, min, max, step, onChange };

  const roundToStep = (v: number, s: number) => Math.round(v / s) * s;

  const dragToValue = (startValue: number, dx: number) => {
    const { min: mn, max: mx, step: st } = latest.current;
    if (trackWidthRef.current <= 0) return startValue;
    const deltaValue = (dx / trackWidthRef.current) * (mx - mn);
    return Math.min(mx, Math.max(mn, roundToStep(startValue + deltaValue, st)));
  };

  const loGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-5, 5])
        .failOffsetY([-10, 10])
        .onStart(() => {
          loStart.current = latest.current.lo;
        })
        .onUpdate(e => {
          const { hi: currentHi, step: st, onChange: cb } = latest.current;
          const next = Math.min(dragToValue(loStart.current, e.translationX), currentHi - st);
          if (next !== latest.current.lo) cb(next, currentHi);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const hiGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-5, 5])
        .failOffsetY([-10, 10])
        .onStart(() => {
          hiStart.current = latest.current.hi;
        })
        .onUpdate(e => {
          const { lo: currentLo, step: st, onChange: cb } = latest.current;
          const next = Math.max(dragToValue(hiStart.current, e.translationX), currentLo + st);
          if (next !== latest.current.hi) cb(currentLo, next);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const percentFor = (v: number) => (max === min ? 0 : (v - min) / (max - min));
  const loPercent = percentFor(lo);
  const hiPercent = percentFor(hi);

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.headerRow}>
        <Text style={[fonts.semibold, styles.label, { color: colors.obInk }]}>
          {label} {required && <Text style={{ color: colors.obRequired }}>*</Text>}
        </Text>
        <Text style={[styles.readout, { color: colors.obGold }]}>
          {lo}
          {unit} – {hi}
          {unit}
        </Text>
      </View>

      <View
        style={styles.trackArea}
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width - THUMB_SIZE;
          trackWidthRef.current = w;
          setTrackWidth(w);
        }}
      >
        <View style={[styles.track, { backgroundColor: colors.obLine2 }]} />
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.obGold,
              left: loPercent * trackWidth + THUMB_SIZE / 2,
              width: (hiPercent - loPercent) * trackWidth,
            },
          ]}
        />
        <GestureDetector gesture={loGesture}>
          <View
            style={[
              styles.thumb,
              { left: loPercent * trackWidth, backgroundColor: colors.surface, borderColor: colors.obGold },
            ]}
          />
        </GestureDetector>
        <GestureDetector gesture={hiGesture}>
          <View
            style={[
              styles.thumb,
              { left: hiPercent * trackWidth, backgroundColor: colors.surface, borderColor: colors.obGold },
            ]}
          />
        </GestureDetector>
      </View>

      <View style={styles.boundsRow}>
        <Text style={[styles.boundsText, { color: colors.obInk3 }]}>
          {min}
          {unit}
        </Text>
        <Text style={[styles.boundsText, { color: colors.obInk3 }]}>
          {max}
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    fontSize: 12.5,
  },
  readout: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  trackArea: {
    height: 22,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  fill: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  boundsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boundsText: {
    fontSize: 10,
  },
});
