import React from 'react';
import { Screen } from '@/shared/ui/Screen';
import { FadeInView } from '@/shared/ui/FadeInView';
import { HomeHeader } from '../components/HomeHeader';
import { HomeGreeting } from '../components/HomeGreeting';
import { StatsCounter } from '../components/StatsCounter';
import { MainActionsGrid } from '../components/MainActionsGrid';
import { SecondaryActions } from '../components/SecondaryActions';
import { FavMemoCarousel } from '../components/FavMemoCarousel';
import { NoterButton } from '../components/NoterButton';

export default function HomeScreen() {
  return (
    <Screen header={<HomeHeader />}>

      {/* ── Greeting ────────────────────── */}
      <FadeInView>
        <HomeGreeting />
      </FadeInView>

      {/* ── Stats counter ───────────────── */}
      <FadeInView>
        <StatsCounter />
      </FadeInView>

      {/* ── 4 main action buttons ───────── */}
      <FadeInView>
        <MainActionsGrid />
      </FadeInView>

      {/* ── 2 secondary buttons ─────────── */}
      <FadeInView>
        <SecondaryActions />
      </FadeInView>

      {/* ── Favourite memos carousel ─────── */}
      <FadeInView>
        <FavMemoCarousel />
      </FadeInView>

      {/* ── Noter entry button ───────────── */}
      <FadeInView>
        <NoterButton />
      </FadeInView>

    </Screen>
  );
}
