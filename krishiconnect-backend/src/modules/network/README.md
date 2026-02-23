# Network (My Network) Module

LinkedIn-style recommendation API: location-based suggestions with scoring, mutual-followers, and profile completeness.

## Debugging empty recommendations

If `GET /network/recommendations` returns `data: []` despite users with the same location existing:

1. **Enable debug logs**: Set `DEBUG_NETWORK=1` or `DEBUG_NETWORK=true` in env. The service will log:
   - Logged-in user location (raw and normalized)
   - Exclude IDs count (self + following)
   - Per-tier query/result counts (city, state, country)

2. **Location storage**: User schema uses nested fields: `location.city`, `location.state`, `location.district`, `location.village`, `location.country`. The recommendation query:
   - **City tier**: Matches `location.city` OR `location.district` (same value), so users who only set district are included.
   - **State tier**: Matches `location.state` (case-insensitive, optional surrounding whitespace).
   - **Country tier**: Matches `location.country` OR null/empty/missing when default is India (backward compatibility).

3. **Exclusions**: Current user and already-followed user IDs are normalized to ObjectIds for `_id: { $nin: [...] }` so string vs ObjectId mismatch does not over-exclude.

## Endpoint

- `GET /api/v1/network/recommendations?page=1&limit=20` (auth required)

## Query optimization

- **lean()**: All User and Follow reads use `.lean()` so Mongoose does not build full documents; reduces memory and CPU.
- **Projection**: Recommendations use a fixed `RECOMMENDATION_PROJECTION` (name, avatar, location, stats, profileCompleteness, etc.) so we never select password, tokens, or other private fields.
- **Single mutual-count aggregation**: For all candidate IDs and “my following” IDs, one `Follow.aggregate([$match, $group])` returns mutual counts per candidate instead of N separate queries (avoids N+1).
- **Pool size cap**: `MAX_POOL_SIZE` (200) limits how many candidates we fetch and score per request so response time stays bounded as the user base grows.

## Indexing decisions

- **User**: `location.city`, `location.state`, `location.country` (each with `isActive` in compound where useful), `stats.followersCount`, `lastProfileUpdate`. These support:
  - Location-tier filters (city → state → country) with index use.
  - Optional future sort by followers or activity.
- **Follow**: Existing indexes `{ follower: 1, following: 1 }` and `{ following: 1, createdAt: -1 }` support:
  - `getFollowingIds`: find by follower, project following.
  - Mutual-count aggregation: match on following + follower in arrays.

## Scalability strategy

- **1M+ users**: Recommendation runs per request with a capped pool. For very large scale:
  - **Precomputed recommendations**: Background job (e.g. daily) builds a “recommendations” collection or cache per user; API reads from that.
  - **Redis cache**: Cache `GET /network/recommendations` per user (e.g. key `rec:userId:page`) with TTL (e.g. 15–60 min); invalidate on follow/unfollow.
  - **Cursor-based pagination**: Replace page/limit with cursor (e.g. last seen score + id) so we don’t skip large offsets.
- **Follow list**: `getFollowingIds` returns an array of IDs; for users with huge following, consider a limit or a separate “follow” cache.

## Potential bottlenecks

1. **Large “following” list**: If a user follows tens of thousands, `getFollowingIds` and the mutual-count aggregation (follower in myFollowingIds) can get heavy. Mitigation: cap “following” in the query or precompute mutual counts in a background job.
2. **Country-only fallback**: When most users have only country set, the country query can return a large set; we limit by `poolSize` and then sort/score in memory, so memory per request is bounded.
3. **No total count**: Total items are derived from the current pool, not a separate countDocuments. For “total results” across the whole system, a dedicated count pipeline or precomputed total would be needed.
