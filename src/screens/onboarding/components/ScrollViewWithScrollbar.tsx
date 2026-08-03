import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '../../../theme';

const ARROW_STEP = 60;
const ARROW_REPEAT_MS = 150;
const MIN_THUMB_HEIGHT = 24;
const ARROW_BUTTON_SIZE = 18;
const ARROW_GAP = 4;
/** The track doesn't get the scrollbar column's full height — the two arrow buttons and their
 * gaps eat into it — so thumb size/position must be computed against this, not raw `visibleHeight`. */
const TRACK_INSET = (ARROW_BUTTON_SIZE + ARROW_GAP) * 2;

/** A `ScrollView` with a desktop-style scrollbar (track + draggable thumb + press-and-hold
 * up/down arrow buttons) instead of RN's native thin fading indicator — built for the "Suggested
 * Interests" box in Step 3, but deliberately content-agnostic (just wraps `children`) so any other
 * long list in this app (Step 4's Industries/Geography pickers, etc.) can reuse it.
 *
 * RN has no built-in equivalent of this — a real OS/browser scrollbar isn't something any RN
 * component provides, so the track/thumb/arrows here are hand-built: thumb size/position are
 * derived from `onContentSizeChange`/`onLayout`/`onScroll` measurements, the thumb drags via a
 * `Gesture.Pan()` (translating drag delta into a proportional scroll offset), and the arrow
 * buttons step the scroll position on tap and repeat on press-and-hold via a plain interval. */
export function ScrollViewWithScrollbar({
  children,
  maxHeight,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  maxHeight: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [visibleHeight, setVisibleHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const scrollYRef = useRef(0);
  const dragStartScrollY = useRef(0);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stopRepeat(), []);

  const maxScroll = Math.max(0, contentHeight - visibleHeight);
  const needsScroll = maxScroll > 0;
  const trackHeight = Math.max(0, visibleHeight - TRACK_INSET);
  const thumbHeight = needsScroll
    ? Math.max(MIN_THUMB_HEIGHT, (visibleHeight / contentHeight) * trackHeight)
    : trackHeight;
  const thumbTravel = Math.max(0, trackHeight - thumbHeight);
  const thumbTop = needsScroll && thumbTravel > 0 ? (scrollY / maxScroll) * thumbTravel : 0;

  const scrollTo = (y: number) => {
    const clamped = Math.max(0, Math.min(maxScroll, y));
    scrollRef.current?.scrollTo({ y: clamped, animated: false });
    scrollYRef.current = clamped;
    setScrollY(clamped);
  };

  // The drag callback below is created exactly once (via `useMemo`) but needs the *current*
  // maxScroll/thumbTravel/scrollTo on every update event — this ref is refreshed on every render
  // so it never reads stale values.
  const latest = useRef({ maxScroll, thumbTravel, scrollTo });
  latest.current = { maxScroll, thumbTravel, scrollTo };

  const stopRepeat = () => {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  };

  const startRepeat = (direction: 1 | -1) => {
    latest.current.scrollTo(scrollYRef.current + ARROW_STEP * direction);
    repeatTimer.current = setInterval(() => {
      latest.current.scrollTo(scrollYRef.current + ARROW_STEP * direction);
    }, ARROW_REPEAT_MS);
  };

  // Built on `react-native-gesture-handler`'s `Gesture.Pan()`, not the legacy `PanResponder` API
  // — see the full explanation in `DualRangeSlider.tsx`, which hit the identical problem: nested
  // inside the page's scrolling `KeyboardAwareScrollView`, `PanResponder`'s termination flags
  // weren't reliable enough to stop the parent ScrollView from reclaiming the gesture mid-drag.
  // Both this thumb's drag and the parent's scroll are vertical (no orthogonal axis to
  // disambiguate on, unlike the slider's horizontal drag vs. the page's vertical scroll), but
  // Gesture Handler's native recognizer still reliably favors a gesture that starts exactly on
  // this small, specific thumb target over the much larger parent ScrollView.
  const thumbGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onStart(() => {
          dragStartScrollY.current = scrollYRef.current;
        })
        .onUpdate(e => {
          const { maxScroll: ms, thumbTravel: tt, scrollTo: doScroll } = latest.current;
          if (tt <= 0) return;
          doScroll(dragStartScrollY.current + (e.translationY / tt) * ms);
        }),
    [],
  );

  return (
    <View style={styles.row}>
      <ScrollView
        ref={scrollRef}
        style={[styles.scroll, { maxHeight }]}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        nestedScrollEnabled
        onLayout={(e: LayoutChangeEvent) => setVisibleHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_w, h) => setContentHeight(h)}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollYRef.current = y;
          setScrollY(y);
        }}
      >
        {children}
      </ScrollView>

      {/* Always reserve this column's width, even when `needsScroll` is false — the ScrollView's
          width must stay constant regardless of scroll state. For wrapping content (like the
          Suggested Interests chips), the column's width affects how many chips fit per row, which
          affects content height, which is exactly what `needsScroll` is computed from — showing
          or hiding the column based on `needsScroll` would create a circular reflow: hiding it
          gives chips more room, which can pull content height back under `maxHeight`, which hides
          the column, which gives chips more room again. Reserving the space unconditionally
          breaks that loop; only the visible thumb/track/arrows are conditional. */}
      <View style={[styles.barColumn, { height: visibleHeight || undefined }]}>
        {needsScroll && (
          <>
            <Pressable
              onPressIn={() => startRepeat(-1)}
              onPressOut={stopRepeat}
              hitSlop={6}
              style={[styles.arrowButton, { backgroundColor: colors.obSurface2 }]}
            >
              <ChevronUp size={11} color={colors.obInk3} strokeWidth={2} />
            </Pressable>

            <View style={[styles.track, { backgroundColor: colors.obLine2 }]}>
              <GestureDetector gesture={thumbGesture}>
                <View
                  style={[styles.thumb, { backgroundColor: colors.obInk3, height: thumbHeight, top: thumbTop }]}
                />
              </GestureDetector>
            </View>

            <Pressable
              onPressIn={() => startRepeat(1)}
              onPressOut={stopRepeat}
              hitSlop={6}
              style={[styles.arrowButton, { backgroundColor: colors.obSurface2 }]}
            >
              <ChevronDown size={11} color={colors.obInk3} strokeWidth={2} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scroll: {
    flex: 1,
  },
  barColumn: {
    width: ARROW_BUTTON_SIZE,
    marginLeft: 6,
    alignItems: 'center',
    gap: ARROW_GAP,
  },
  arrowButton: {
    width: ARROW_BUTTON_SIZE,
    height: ARROW_BUTTON_SIZE,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    width: 5,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: 5,
    borderRadius: 3,
  },
});
