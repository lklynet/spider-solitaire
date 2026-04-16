import React from 'react';
import { CalendarDays, Crown, Medal, Radar, Star, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { useOfficialStore } from '../store/officialStore';

type HubTab = 'daily' | 'weekly' | 'monthly' | 'global' | 'history' | 'profile' | 'admin';

const formatSeconds = (value: number) => `${Math.round(value / 1000)}s`;

export const RaceHub: React.FC = () => {
  const {
    sessionUser,
    leaderboard,
    weeklyLeaderboard,
    monthlyLeaderboard,
    globalLeaderboard,
    history,
    profile,
    adminRecentSubmissions
  } = useOfficialStore();
  const [tab, setTab] = React.useState<HubTab>('daily');

  const tabs: Array<{ id: HubTab; label: string; hidden?: boolean }> = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'global', label: 'Global' },
    { id: 'history', label: 'History' },
    { id: 'profile', label: 'Profile', hidden: !profile },
    { id: 'admin', label: 'Admin', hidden: sessionUser?.role !== 'admin' }
  ];

  const standings =
    tab === 'daily'
      ? leaderboard
      : tab === 'weekly'
        ? weeklyLeaderboard
        : tab === 'monthly'
          ? monthlyLeaderboard
          : globalLeaderboard;

  return (
    <section className="w-full">
      <div className="rounded-[32px] border-4 border-primary bg-popover shadow-[12px_12px_0px_0px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="border-b-4 border-primary/40 bg-[linear-gradient(180deg,rgba(255,215,0,0.12),rgba(0,0,0,0.08))] p-5 lg:border-b-0 lg:border-r-4">
            <div className="text-[11px] font-black uppercase tracking-[0.34em] text-primary/60">
              Race Hub
            </div>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-primary">
              Standing Room Only
            </h2>
            <p className="mt-2 max-w-md text-sm font-bold text-primary/75">
              The official side of the app lives here: seasonal ladders, player profile, and
              verification telemetry for admins.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/55">
                  Global Leader
                </div>
                <div className="mt-2 text-lg font-black text-primary">
                  {globalLeaderboard[0]?.displayName ?? 'No one yet'}
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-primary/60">
                  {globalLeaderboard[0] ? `${globalLeaderboard[0].points} pts` : 'Awaiting results'}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/55">
                  Daily Pace
                </div>
                <div className="mt-2 text-lg font-black text-primary">
                  {leaderboard[0] ? formatSeconds(leaderboard[0].adjustedTimeMs) : '--'}
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-primary/60">
                  {leaderboard[0]?.displayName ?? 'No verified finish'}
                </div>
              </div>
            </div>

            {profile && (
              <div className="mt-4 rounded-[24px] border-2 border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-primary bg-popover text-xl font-black text-primary">
                    {profile.user.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-lg font-black text-primary">{profile.user.displayName}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-primary/60">
                      @{profile.user.username}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-primary/20 bg-black/10 px-2 py-3 text-center">
                    <Trophy className="mx-auto h-4 w-4 text-primary/70" />
                    <div className="mt-1 text-lg font-black text-primary">{profile.badges.totalPoints}</div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-primary/55">Points</div>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-black/10 px-2 py-3 text-center">
                    <Crown className="mx-auto h-4 w-4 text-primary/70" />
                    <div className="mt-1 text-lg font-black text-primary">{profile.badges.wins1st}</div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-primary/55">Wins</div>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-black/10 px-2 py-3 text-center">
                    <Medal className="mx-auto h-4 w-4 text-primary/70" />
                    <div className="mt-1 text-lg font-black text-primary">{profile.badges.finishesTop3}</div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-primary/55">Top 3</div>
                  </div>
                </div>
              </div>
            )}
          </aside>

          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {tabs
                .filter((item) => !item.hidden)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      'rounded-full border-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] transition',
                      tab === item.id
                        ? 'border-primary bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)]'
                        : 'border-primary/25 bg-black/10 text-primary/70'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            <div className="mt-5">
              {tab === 'profile' && profile ? (
                <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-[24px] border-2 border-primary/30 bg-black/10 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                      Badge Cabinet
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {[
                        ['Top 5', profile.badges.finishesTop5],
                        ['Top 10', profile.badges.finishesTop10],
                        ['Played', profile.badges.daysPlayed],
                        ['Submitted', profile.badges.daysSubmitted],
                        ['Best Rank', profile.badges.bestRank ?? '-'],
                        ['Verified', profile.badges.verifiedSubmissions]
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-primary/20 bg-popover px-3 py-4 text-center"
                        >
                          <div className="text-xl font-black text-primary">{value}</div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-primary/55">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[24px] border-2 border-primary/30 bg-black/10 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                      Recent Finishes
                    </div>
                    <div className="mt-3 space-y-3">
                      {profile.recentFinishes.length === 0 ? (
                        <div className="rounded-2xl border border-primary/20 bg-popover px-4 py-5 text-sm font-bold text-primary/70">
                          No finalized race results yet.
                        </div>
                      ) : (
                        profile.recentFinishes.map((finish) => (
                          <div
                            key={finish.challengeDate}
                            className="flex items-center justify-between rounded-2xl border border-primary/20 bg-popover px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <CalendarDays className="h-5 w-5 text-primary/60" />
                              <div>
                                <div className="font-black text-primary">{finish.challengeDate}</div>
                                <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                                  Finalized result
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-primary">#{finish.rank}</div>
                              <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                                {finish.pointsAwarded} pts
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : tab === 'history' ? (
                <div className="rounded-[24px] border-2 border-primary/30 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                      Race History
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-primary/55">
                      Recent finalized daily races
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {history.length === 0 ? (
                      <div className="rounded-2xl border border-primary/20 bg-popover px-4 py-5 text-sm font-bold text-primary/70">
                        No finalized daily races yet.
                      </div>
                    ) : (
                      history.map((day) => (
                        <div
                          key={day.challengeDate}
                          className="rounded-2xl border border-primary/20 bg-popover px-4 py-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-black text-primary">{day.challengeDate}</div>
                              <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                                {day.totalRankedPlayers} ranked players
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                                Winner
                              </div>
                              <div className="font-black text-primary">
                                {day.winner ? day.winner.displayName : 'No verified winner'}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-3">
                            {day.podium.map((entry) => (
                              <div
                                key={`${day.challengeDate}-${entry.username}`}
                                className="rounded-xl border border-primary/15 bg-black/10 px-3 py-3"
                              >
                                <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                                  #{entry.rank}
                                </div>
                                <div className="font-black text-primary">{entry.displayName}</div>
                                <div className="text-xs font-bold text-primary/70">
                                  {formatSeconds(entry.adjustedTimeMs)} · {entry.pointsAwarded} pts
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : tab === 'admin' ? (
                <div className="rounded-[24px] border-2 border-primary/30 bg-black/10 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                    <Radar className="h-4 w-4" />
                    Verification Telemetry
                  </div>
                  <div className="mt-3 space-y-3">
                    {adminRecentSubmissions.length === 0 ? (
                      <div className="rounded-2xl border border-primary/20 bg-popover px-4 py-5 text-sm font-bold text-primary/70">
                        No recent submissions to inspect.
                      </div>
                    ) : (
                      adminRecentSubmissions.map((entry) => (
                        <div
                          key={entry.attemptId}
                          className="grid gap-3 rounded-2xl border border-primary/20 bg-popover px-4 py-3 md:grid-cols-[1.1fr_0.9fr]"
                        >
                          <div>
                            <div className="font-black text-primary">
                              {entry.displayName} <span className="text-primary/55">@{entry.username}</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                              {entry.challengeDate} · {entry.eventCount} events
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-bold text-primary/80">
                              {entry.adjustedTimeMs ? formatSeconds(entry.adjustedTimeMs) : '--'}
                            </div>
                            <div
                              className={cn(
                                'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]',
                                entry.verificationStatus === 'verified'
                                  ? 'border-green-400/50 bg-green-500/10 text-green-100'
                                  : 'border-red-400/50 bg-red-500/10 text-red-100'
                              )}
                            >
                              {entry.verificationStatus}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border-2 border-primary/30 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                      {tab} standings
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-primary/55">
                      {tab === 'daily' ? 'Adjusted time' : 'Points ladder'}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {standings.length === 0 ? (
                      <div className="rounded-2xl border border-primary/20 bg-popover px-4 py-5 text-sm font-bold text-primary/70">
                        No standings available yet.
                      </div>
                    ) : (
                      standings.slice(0, 12).map((entry, index) => (
                        <div
                          key={`${tab}-${entry.userId}`}
                          className={cn(
                            'grid items-center gap-3 rounded-2xl border border-primary/20 bg-popover px-4 py-3 md:grid-cols-[0.3fr_1.3fr_0.7fr]',
                            index === 0 && 'border-yellow-300/50 bg-yellow-400/10'
                          )}
                        >
                          <div className="flex items-center gap-2 font-black text-primary">
                            {index === 0 ? <Star className="h-4 w-4 text-yellow-200" /> : null}
                            #{entry.rank}
                          </div>
                          <div>
                            <div className="font-black text-primary">{entry.displayName}</div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                              @{entry.username}
                            </div>
                          </div>
                          <div className="text-right">
                            {'adjustedTimeMs' in entry ? (
                              <>
                                <div className="font-black text-primary">
                                  {formatSeconds(entry.adjustedTimeMs)}
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                                  {entry.pointsAwarded} pts
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-black text-primary">{entry.points} pts</div>
                                <div className="text-[10px] uppercase tracking-[0.16em] text-primary/55">
                                  {entry.wins} wins · {entry.top3} top 3
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {tab === 'daily' && (
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary/80">
                      Only verified official wins are eligible for final ranking and point awards.
                    </div>
                  )}
                  {tab !== 'daily' && (
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary/80">
                      Period boards rank by finalized points, then wins, then top 3 finishes.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
