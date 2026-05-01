import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  useWindowDimensions,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionCardProps {
  tag: string;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
  isRTL: boolean;
}

interface StatBubbleProps {
  label: string;
  value: string;
  color: string;
}

interface RecommendationCardProps {
  icon: string;
  title: string;
  body: string;
  index: number;
  isRTL: boolean;
}

interface StepCardProps {
  title: string;
  subtitle: string;
  body: string;
  stepNumber: number;
  isRTL: boolean;
}

interface TechniqueCardProps {
  title: string;
  body: string;
  isRTL: boolean;
}

interface PillarProps {
  title: string;
  body: string;
  icon: string;
  isRTL: boolean;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0d0f0a',
  bgCard: '#141810',
  bgCardAlt: '#111309',
  lime: '#a3e635',
  limeDeep: '#84cc16',
  limeMuted: '#4d7c0f',
  limeDim: '#1a2e05',
  gold: '#eab308',
  goldDim: '#2a1f00',
  teal: '#2dd4bf',
  tealDim: '#042f2e',
  rose: '#fb7185',
  roseDim: '#2d0a11',
  amber: '#fbbf24',
  amberDim: '#271b00',
  border: '#1f2511',
  borderLime: '#2d4a08',
  textPrimary: '#f1f5e8',
  textSecondary: '#9aab72',
  textMuted: '#5a6640',
  textTag: '#a3e635',
  scrollBar: '#2d4a08',
};

const READING_MINUTES = 12;

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionCard: React.FC<SectionCardProps> = ({
  tag,
  title,
  children,
  accentColor = COLORS.lime,
  isRTL,
}) => (
  <View style={[styles.sectionCard, { borderLeftColor: isRTL ? 'transparent' : accentColor, borderRightColor: isRTL ? accentColor : 'transparent' }]}>
    <Text style={[styles.sectionTag, { color: accentColor, textAlign: isRTL ? 'right' : 'left' }]}>
      {tag.toUpperCase()}
    </Text>
    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
    {children}
  </View>
);

const StatBubble: React.FC<StatBubbleProps> = ({ label, value, color }) => (
  <View style={[styles.statBubble, { borderColor: color + '40', backgroundColor: color + '12' }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RecommendationCard: React.FC<RecommendationCardProps> = ({ icon, title, body, index, isRTL }) => {
  const colors = [COLORS.lime, COLORS.teal, COLORS.gold, COLORS.rose, COLORS.amber, COLORS.limeDeep];
  const accent = colors[index % colors.length];
  return (
    <View style={[styles.recCard, { borderColor: accent + '30' }]}>
      <View style={[styles.recIconWrap, { backgroundColor: accent + '18' }]}>
        <Text style={styles.recIcon}>{icon}</Text>
      </View>
      <View style={styles.recText}>
        <Text style={[styles.recTitle, { color: accent, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[styles.recBody, { textAlign: isRTL ? 'right' : 'left' }]}>{body}</Text>
      </View>
    </View>
  );
};

const StepCard: React.FC<StepCardProps> = ({ title, subtitle, body, stepNumber, isRTL }) => (
  <View style={styles.stepCard}>
    <View style={styles.stepHeader}>
      <View style={styles.stepNumberWrap}>
        <Text style={styles.stepNumber}>{stepNumber}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[styles.stepSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text>
      </View>
    </View>
    <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>{body}</Text>
  </View>
);

const TechniqueCard: React.FC<TechniqueCardProps> = ({ title, body, isRTL }) => (
  <View style={styles.techniqueCard}>
    <Text style={[styles.techniqueTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
    <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>{body}</Text>
  </View>
);

const PillarCard: React.FC<PillarProps> = ({ title, body, icon, isRTL }) => (
  <View style={styles.pillarCard}>
    <Text style={styles.pillarIcon}>{icon}</Text>
    <Text style={[styles.pillarTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
    <Text style={[styles.pillarBody, { textAlign: isRTL ? 'right' : 'left' }]}>{body}</Text>
  </View>
);

// ─── Animated progress bar ────────────────────────────────────────────────────

const ReadingProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const width = `${Math.min(progress * 100, 100)}%` as any;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width }]} />
    </View>
  );
};

// ─── Table of Contents ────────────────────────────────────────────────────────

const TableOfContents: React.FC<{
  sections: { key: string; title: string }[];
  onPress: (key: string) => void;
  isRTL: boolean;
  tocLabel: string;
}> = ({ sections, onPress, isRTL, tocLabel }) => (
  <View style={styles.tocCard}>
    <Text style={[styles.tocTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{tocLabel}</Text>
    {sections.map((s, i) => (
      <TouchableOpacity key={s.key} style={styles.tocRow} onPress={() => onPress(s.key)}>
        <Text style={styles.tocNum}>{(i + 1).toString().padStart(2, '0')}</Text>
        <Text style={[styles.tocItem, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}>{s.title}</Text>
        <Text style={styles.tocArrow}>{isRTL ? '←' : '→'}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const MemorizationScienceScreen: React.FC = () => {
  const { t, i18n } = useTranslation('memorizationScience');
  const isRTL = i18n.language === 'ar' || I18nManager.isRTL;
  const { width } = useWindowDimensions();

  const scrollRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, number>>({});
  const [readProgress, setReadProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const totalScrollable = contentSize.height - layoutMeasurement.height;
      if (totalScrollable > 0) {
        setReadProgress(contentOffset.y / totalScrollable);
      }
    },
    []
  );

  const scrollToSection = useCallback((key: string) => {
    const y = sectionRefs.current[key];
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: y - 24, animated: true });
    }
  }, []);

  const registerSection = (key: string) => (event: any) => {
    sectionRefs.current[key] = event.nativeEvent.layout.y;
  };

  const ns = 'sections';
  const sectionKeys = [
    { key: 'intro', title: t(`${ns}.intro.title`) },
    { key: 'forgettingCurve', title: t(`${ns}.forgettingCurve.title`) },
    { key: 'spacedRepetition', title: t(`${ns}.spacedRepetition.title`) },
    { key: 'activeRecall', title: t(`${ns}.activeRecall.title`) },
    { key: 'neuroscience', title: t(`${ns}.neuroscience.title`) },
    { key: 'interleaving', title: t(`${ns}.interleaving.title`) },
    { key: 'recommendations', title: t(`${ns}.recommendations.title`) },
    { key: 'mahfodNote', title: t(`${ns}.mahfodNote.title`) },
  ];

  const recItems: Array<{ icon: string; title: string; body: string }> = t(
    `${ns}.recommendations.recs`,
    { returnObjects: true }
  ) as any;

  const mahfodFeatures: string[] = t(`${ns}.mahfodNote.features`, { returnObjects: true }) as any;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Fixed progress bar */}
      <ReadingProgressBar progress={readProgress} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {t('readingTime', { minutes: READING_MINUTES })}
              </Text>
            </View>
            <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('pageTitle')}
            </Text>
            <Text style={[styles.heroSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('pageSubtitle')}
            </Text>
            <View style={styles.heroDivider} />
          </View>

          {/* ── Table of Contents ── */}
          <TableOfContents
            sections={sectionKeys}
            onPress={scrollToSection}
            isRTL={isRTL}
            tocLabel={t('labels.tableOfContents')}
          />

          {/* ── 1. Introduction ── */}
          <View onLayout={registerSection('intro')}>
            <SectionCard
              tag={t(`${ns}.intro.tag`)}
              title={t(`${ns}.intro.title`)}
              accentColor={COLORS.lime}
              isRTL={isRTL}
            >
              <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.intro.body`)}
              </Text>
              <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>"{t(`${ns}.intro.quote`)}"</Text>
                <Text style={styles.quoteAuthor}>— {t(`${ns}.intro.quoteAuthor`)}</Text>
              </View>
            </SectionCard>
          </View>

          {/* ── 2. Forgetting Curve ── */}
          <View onLayout={registerSection('forgettingCurve')}>
            <SectionCard
              tag={t(`${ns}.forgettingCurve.tag`)}
              title={t(`${ns}.forgettingCurve.title`)}
              accentColor={COLORS.rose}
              isRTL={isRTL}
            >
              <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.forgettingCurve.body`)}
              </Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <StatBubble
                  label={t(`${ns}.forgettingCurve.statLabel1`)}
                  value={t(`${ns}.forgettingCurve.statValue1`)}
                  color={COLORS.rose}
                />
                <StatBubble
                  label={t(`${ns}.forgettingCurve.statLabel2`)}
                  value={t(`${ns}.forgettingCurve.statValue2`)}
                  color={COLORS.amber}
                />
                <StatBubble
                  label={t(`${ns}.forgettingCurve.statLabel3`)}
                  value={t(`${ns}.forgettingCurve.statValue3`)}
                  color={COLORS.limeDeep}
                />
              </View>

              {/* Curve visual */}
              <ForgettingCurveVisual />

              <View style={styles.insightBox}>
                <Text style={styles.insightIcon}>💡</Text>
                <Text style={[styles.insightText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.forgettingCurve.insight`)}
                </Text>
              </View>
            </SectionCard>
          </View>

          {/* ── 3. Spaced Repetition ── */}
          <View onLayout={registerSection('spacedRepetition')}>
            <SectionCard
              tag={t(`${ns}.spacedRepetition.tag`)}
              title={t(`${ns}.spacedRepetition.title`)}
              accentColor={COLORS.teal}
              isRTL={isRTL}
            >
              <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.spacedRepetition.body`)}
              </Text>
              <View style={[styles.mechanismBox, { borderColor: COLORS.teal + '30' }]}>
                <Text style={[styles.mechanismTitle, { color: COLORS.teal, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.spacedRepetition.mechanismTitle`)}
                </Text>
                <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.spacedRepetition.mechanismBody`)}
                </Text>
              </View>
              <View style={styles.researchBox}>
                <Text style={styles.researchIcon}>📊</Text>
                <Text style={[styles.researchText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.spacedRepetition.researchBox`)}
                </Text>
              </View>
              <View style={[styles.mechanismBox, { borderColor: COLORS.limeMuted + '50', backgroundColor: COLORS.limeDim }]}>
                <Text style={[styles.mechanismTitle, { color: COLORS.lime, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.spacedRepetition.sm2Title`)}
                </Text>
                <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.spacedRepetition.sm2Body`)}
                </Text>
              </View>
            </SectionCard>
          </View>

          {/* ── 4. Active Recall ── */}
          <View onLayout={registerSection('activeRecall')}>
            <SectionCard
              tag={t(`${ns}.activeRecall.tag`)}
              title={t(`${ns}.activeRecall.title`)}
              accentColor={COLORS.gold}
              isRTL={isRTL}
            >
              <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.activeRecall.body`)}
              </Text>
              <Text style={[styles.subSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.activeRecall.pillars.title`)}
              </Text>
              <View style={styles.pillarsRow}>
                <PillarCard
                  icon="🫣"
                  title={t(`${ns}.activeRecall.pillars.p1Title`)}
                  body={t(`${ns}.activeRecall.pillars.p1Body`)}
                  isRTL={isRTL}
                />
                <PillarCard
                  icon="✍️"
                  title={t(`${ns}.activeRecall.pillars.p2Title`)}
                  body={t(`${ns}.activeRecall.pillars.p2Body`)}
                  isRTL={isRTL}
                />
                <PillarCard
                  icon="🎯"
                  title={t(`${ns}.activeRecall.pillars.p3Title`)}
                  body={t(`${ns}.activeRecall.pillars.p3Body`)}
                  isRTL={isRTL}
                />
              </View>
              <View style={styles.researchBox}>
                <Text style={styles.researchIcon}>📖</Text>
                <Text style={[styles.researchText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.activeRecall.studyRef`)}
                </Text>
              </View>
            </SectionCard>
          </View>

          {/* ── 5. Neuroscience ── */}
          <View onLayout={registerSection('neuroscience')}>
            <SectionCard
              tag={t(`${ns}.neuroscience.tag`)}
              title={t(`${ns}.neuroscience.title`)}
              accentColor={COLORS.teal}
              isRTL={isRTL}
            >
              <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.neuroscience.body`)}
              </Text>

              <StepCard
                stepNumber={1}
                title={t(`${ns}.neuroscience.steps.encoding.title`)}
                subtitle={t(`${ns}.neuroscience.steps.encoding.subtitle`)}
                body={t(`${ns}.neuroscience.steps.encoding.body`)}
                isRTL={isRTL}
              />
              <StepCard
                stepNumber={2}
                title={t(`${ns}.neuroscience.steps.consolidation.title`)}
                subtitle={t(`${ns}.neuroscience.steps.consolidation.subtitle`)}
                body={t(`${ns}.neuroscience.steps.consolidation.body`)}
                isRTL={isRTL}
              />
              <StepCard
                stepNumber={3}
                title={t(`${ns}.neuroscience.steps.retrieval.title`)}
                subtitle={t(`${ns}.neuroscience.steps.retrieval.subtitle`)}
                body={t(`${ns}.neuroscience.steps.retrieval.body`)}
                isRTL={isRTL}
              />

              <View style={styles.expertBox}>
                <Text style={styles.expertQuoteMark}>"</Text>
                <Text style={[styles.expertQuote, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.neuroscience.expertQuote`)}
                </Text>
                <Text style={[styles.expertName, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.neuroscience.expertName`)}
                </Text>
                <Text style={[styles.expertTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`${ns}.neuroscience.expertTitle`)}
                </Text>
              </View>
            </SectionCard>
          </View>

          {/* ── 6. Interleaving ── */}
          <View onLayout={registerSection('interleaving')}>
            <SectionCard
              tag={t(`${ns}.interleaving.tag`)}
              title={t(`${ns}.interleaving.title`)}
              accentColor={COLORS.amber}
              isRTL={isRTL}
            >
              <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.interleaving.body`)}
              </Text>
              <TechniqueCard
                title={t(`${ns}.interleaving.techniques.interleaving.title`)}
                body={t(`${ns}.interleaving.techniques.interleaving.body`)}
                isRTL={isRTL}
              />
              <TechniqueCard
                title={t(`${ns}.interleaving.techniques.elaboration.title`)}
                body={t(`${ns}.interleaving.techniques.elaboration.body`)}
                isRTL={isRTL}
              />
              <TechniqueCard
                title={t(`${ns}.interleaving.techniques.selfExplanation.title`)}
                body={t(`${ns}.interleaving.techniques.selfExplanation.body`)}
                isRTL={isRTL}
              />
            </SectionCard>
          </View>

          {/* ── 7. Recommendations ── */}
          <View onLayout={registerSection('recommendations')}>
            <SectionCard
              tag={t(`${ns}.recommendations.tag`)}
              title={t(`${ns}.recommendations.title`)}
              accentColor={COLORS.lime}
              isRTL={isRTL}
            >
              <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.recommendations.intro`)}
              </Text>
              {Array.isArray(recItems) &&
                recItems.map((rec, i) => (
                  <RecommendationCard
                    key={i}
                    icon={rec.icon}
                    title={rec.title}
                    body={rec.body}
                    index={i}
                    isRTL={isRTL}
                  />
                ))}
            </SectionCard>
          </View>

          {/* ── 8. Mahfod Note ── */}
          <View onLayout={registerSection('mahfodNote')}>
            <View style={styles.mahfodCard}>
              <Text style={[styles.sectionTag, { color: COLORS.lime, textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.mahfodNote.tag`).toUpperCase()}
              </Text>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.mahfodNote.title`)}
              </Text>
              <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(`${ns}.mahfodNote.body`)}
              </Text>
              <View style={styles.featureGrid}>
                {Array.isArray(mahfodFeatures) &&
                  mahfodFeatures.map((f, i) => (
                    <View key={i} style={styles.featureChip}>
                      <Text style={styles.featureChipDot}>●</Text>
                      <Text style={[styles.featureChipText, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {f}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          </View>

          {/* ── Conclusion ── */}
          <SectionCard
            tag={t(`${ns}.conclusion.tag`)}
            title={t(`${ns}.conclusion.title`)}
            accentColor={COLORS.gold}
            isRTL={isRTL}
          >
            <Text style={[styles.sectionBody, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t(`${ns}.conclusion.body`)}
            </Text>
            <View style={[styles.finalQuoteBox]}>
              <Text style={styles.finalQuoteText}>"{t(`${ns}.conclusion.finalQuote`)}"</Text>
              <Text style={styles.finalQuoteAuthor}>— {t(`${ns}.conclusion.finalQuoteAuthor`)}</Text>
            </View>
          </SectionCard>

          {/* ── Back to top ── */}
          <TouchableOpacity
            style={styles.backToTopBtn}
            onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          >
            <Text style={styles.backToTopText}>↑ {t('labels.backToTop')}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Forgetting Curve Visual ──────────────────────────────────────────────────

const ForgettingCurveVisual: React.FC = () => {
  const points = [
    { x: 0, y: 0 },
    { x: 8, y: 50 },
    { x: 18, y: 70 },
    { x: 100, y: 90 },
  ];
  const W = 280;
  const H = 90;
  const toSvgX = (pct: number) => (pct / 100) * W;
  const toSvgY = (pct: number) => (pct / 100) * H;

  const pathD = points
    .map((p, i) =>
      i === 0
        ? `M ${toSvgX(p.x)} ${toSvgY(p.y)}`
        : `L ${toSvgX(p.x)} ${toSvgY(p.y)}`
    )
    .join(' ');

  return (
    <View style={styles.curveWrap}>
      <View style={styles.curveContainer}>
        {/* Y axis label */}
        <Text style={styles.curveYLabel}>نسبة النسيان ٪</Text>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <View
            key={pct}
            style={[
              styles.curveGridLine,
              { top: (pct / 100) * H, width: W },
            ]}
          />
        ))}
        {/* Curve as a series of segments */}
        {points.slice(1).map((p, i) => {
          const prev = points[i];
          const x1 = toSvgX(prev.x);
          const y1 = toSvgY(prev.y);
          const x2 = toSvgX(p.x);
          const y2 = toSvgY(p.y);
          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x1,
                top: y1 + 16,
                width: length,
                height: 2.5,
                backgroundColor: COLORS.rose,
                transformOrigin: '0 50%',
                transform: [{ rotate: `${angle}deg` }],
                opacity: 0.85,
              }}
            />
          );
        })}
        {/* Dots */}
        {points.map((p, i) => (
          <View
            key={i}
            style={[
              styles.curveDot,
              {
                left: toSvgX(p.x) - 5,
                top: toSvgY(p.y) + 16 - 5,
              },
            ]}
          />
        ))}
      </View>
      {/* X axis labels */}
      <View style={styles.curveXLabels}>
        <Text style={styles.curveXLabel}>0</Text>
        <Text style={styles.curveXLabel}>1h</Text>
        <Text style={styles.curveXLabel}>24h</Text>
        <Text style={styles.curveXLabel}>7d</Text>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    zIndex: 100,
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.lime,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  // Hero
  hero: {
    marginBottom: 28,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.limeDim,
    borderColor: COLORS.borderLime,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: COLORS.lime,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Bold' : 'Cairo_700Bold',
    lineHeight: 38,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 22,
    marginBottom: 20,
  },
  heroDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Table of Contents
  tocCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  tocTitle: {
    color: COLORS.lime,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  tocNum: {
    color: COLORS.limeMuted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    width: 22,
  },
  tocItem: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 20,
  },
  tocArrow: {
    color: COLORS.limeMuted,
    fontSize: 13,
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    padding: 20,
    marginBottom: 16,
  },
  sectionTag: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Bold' : 'Cairo_700Bold',
    lineHeight: 28,
    marginBottom: 14,
  },
  sectionBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 24,
    marginBottom: 12,
  },
  subSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    marginTop: 8,
    marginBottom: 12,
  },

  // Quote
  quoteBox: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 8,
  },
  quoteText: {
    color: COLORS.lime,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 6,
    textAlign: 'center',
  },
  quoteAuthor: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  statBubble: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Bold' : 'Cairo_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Insight
  insightBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.limeDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLime,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  insightIcon: { fontSize: 18 },
  insightText: {
    flex: 1,
    color: COLORS.lime,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 22,
  },

  // Mechanism box
  mechanismBox: {
    backgroundColor: COLORS.tealDim,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  mechanismTitle: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    marginBottom: 8,
    letterSpacing: 0.4,
  },

  // Research box
  researchBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.goldDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  researchIcon: { fontSize: 18 },
  researchText: {
    flex: 1,
    color: COLORS.amber,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 22,
  },

  // Pillars
  pillarsRow: {
    gap: 10,
    marginBottom: 12,
  },
  pillarCard: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  pillarIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  pillarTitle: {
    color: COLORS.gold,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    marginBottom: 6,
  },
  pillarBody: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 20,
  },

  // Steps
  stepCard: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  stepNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.teal + '20',
    borderWidth: 1,
    borderColor: COLORS.teal + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: COLORS.teal,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Bold' : 'Cairo_700Bold',
  },
  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
  },
  stepSubtitle: {
    color: COLORS.teal,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    opacity: 0.7,
  },

  // Expert quote
  expertBox: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginTop: 8,
  },
  expertQuoteMark: {
    color: COLORS.teal,
    fontSize: 40,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Bold' : 'Cairo_700Bold',
    lineHeight: 40,
    marginBottom: -4,
  },
  expertQuote: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 24,
    marginBottom: 12,
  },
  expertName: {
    color: COLORS.teal,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
  },
  expertTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    marginTop: 2,
  },

  // Techniques
  techniqueCard: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.amber + '25',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber,
    padding: 14,
    marginBottom: 10,
  },
  techniqueTitle: {
    color: COLORS.amber,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    marginBottom: 8,
  },

  // Recommendations
  recCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recIcon: { fontSize: 20 },
  recText: { flex: 1 },
  recTitle: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    marginBottom: 5,
  },
  recBody: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 20,
  },

  // Mahfod Card
  mahfodCard: {
    backgroundColor: COLORS.limeDim,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLime,
    padding: 20,
    marginBottom: 16,
  },
  featureGrid: {
    gap: 8,
    marginTop: 12,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureChipDot: {
    color: COLORS.lime,
    fontSize: 8,
    marginTop: 6,
  },
  featureChipText: {
    color: COLORS.lime,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    lineHeight: 20,
    flex: 1,
  },

  // Final quote
  finalQuoteBox: {
    backgroundColor: COLORS.goldDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
    padding: 18,
    marginTop: 10,
  },
  finalQuoteText: {
    color: COLORS.gold,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-SemiBold' : 'Cairo_600SemiBold',
    fontStyle: 'italic',
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 8,
  },
  finalQuoteAuthor: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    textAlign: 'center',
  },

  // Back to top
  backToTopBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backToTopText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
  },

  // Curve visual
  curveWrap: {
    marginVertical: 12,
    alignItems: 'center',
  },
  curveContainer: {
    width: 280,
    height: 106,
    position: 'relative',
  },
  curveYLabel: {
    position: 'absolute',
    left: -30,
    top: 35,
    color: COLORS.textMuted,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
    transform: [{ rotate: '-90deg' }],
  },
  curveGridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.5,
    left: 0,
  },
  curveDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.rose,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  curveXLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    marginTop: 4,
  },
  curveXLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Cairo-Regular' : 'Cairo_400Regular',
  },
});

export default MemorizationScienceScreen;
