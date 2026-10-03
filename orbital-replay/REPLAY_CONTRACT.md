# Orbital replay/v1 JSON import contract

This is a consumer contract. Producers remain independent; no core changes are required. `src/replay.mjs` is the authoritative validator and `replay.schema.json` describes the structural contract. Imports are atomic: validate first, then replace. All unknown fields are rejected. Files are limited to 20 MiB, UTF-8 JSON. JSON numbers must be finite; numeric strings, NaN and Infinity are invalid. Never put payloads, credentials or research prompts in exports.

## Top-level fields (all required)

| Field | Meaning |
|---|---|
| schema | Exactly `orbital-replay/v1` |
| title | Nonempty string, at most 500 characters |
| mode | `replay` or `illustrative`. Any illustrative source requires illustrative mode. |
| duration_s | Elapsed SI seconds, 0–86400, inclusive. Replay runs once and stops. |
| provenance | At most 100 source objects |
| nodes | At most 1000 node objects |
| links | At most 4000 link objects |
| requests | At most 5000 request/transport objects |
| ground_traces | At most 100 ground-access trace objects |
| events | At most 50000 chronological event objects |

IDs are nonempty strings up to 500 characters. IDs must be unique within their collection. References must resolve within the same export. Each timeline must be in [0, duration_s]. Use empty arrays when a channel was not exported. Missing numbers may be null or omitted in telemetry samples and the metrics object. Required nullable fields must be present: node.position_source, position.rtn_m, request.size_bytes, request.metrics_at_s.

## Provenance

`{id, label, kind, description, sha256?}`. All text fields are nonempty, at most 500 characters. `sha256`, if present, is 64 lowercase hex characters. Declare precisely which bytes it hashes in description or a sidecar manifest. Kind is one of:

- `simulated_positions`: declared synthetic/simulated local positions; never measured ephemeris.
- `assumed_network`: experimental optical topology, rate, queue or delay assumptions.
- `recorded_transport`: exported packet/serializer ledger values.
- `recorded_inference`: actual exported inference request events and timing metrics.
- `measured_ground_trace`: ground-access measurements or declared derived replay/plot values.
- `illustrative`: generated demonstration values, always in illustrative mode.

Descriptions should include model, source clock, units, preprocessing, original UTC origin/window if relevant, aggregation, measurement limits and attribution. Larger documentation belongs in a companion file. No third-party URI is fetched from an import.

## Nodes and local position samples

`{id, label, position_source, positions}`

`position_source` references simulated_positions or illustrative provenance, or is null when positions are absent. `positions` has at most 20000 `{t_s, rtn_m}` samples. Times must strictly increase. `rtn_m` is `[radial_m, along_track_m, cross_track_m]` with finite coordinates in [-1e9, 1e9], or null for missing geometry. Three-dimensional local RTN coordinates are supported; measured inertial/ephemeris formats are intentionally not accepted in v1.

Rendering interpolates linearly only between two available positions. No extrapolation before the first or beyond the last sample; no interpolation across null. A single sample is visible only at its exact time. Positions are never generated for positionless trace/transport nodes. The local camera auto-fits the exported position envelope and preserves relative geometry. Glyph sizes are enlarged. Earth/circular orbit, coarse continent illustration and global formation footprint are diagrams, never an ephemeris or ground-contact model. Its phase is a fixed illustrative 5863.694 s cycle; it is not inferred from an imported trace.

## Optical links and telemetry

`{id, src, dst, source, samples}`. Endpoints reference node IDs. Source references assumed_network, recorded_transport or illustrative provenance. Optical connectivity is an assumption; a line does not establish real line-of-sight or capacity.

`samples`: at most 20000 objects with required `t_s` and optional nullable `bandwidth_bps`, `delay_ms`, `queue_bytes`. Nonnegative numbers only. Times are nondecreasing. At duplicate timestamps the last input sample wins. Samples are complete snapshots: an omitted or null metric is unknown, never carried from another sample. The UI holds the latest snapshot until the next sample, and marks its sample time. Producers should append a null snapshot at validity boundaries to stop holding stale values. Export nominal rate or serializer rate explicitly in provenance; neither is measured optical capacity. Queue occupancy must come from the producer, never be inferred from RTT.

## Requests

`{id, kind, source, src, dst, route, size_bytes, events, metrics, metrics_at_s}`

- kind: `transport` or `inference`.
- source: transport requires recorded_transport/illustrative; inference requires recorded_inference/illustrative.
- route: up to 100 link IDs. Empty is allowed when no route is exported.
- size_bytes: nonnegative number or null.
- events: at most 20000 chronological `{t_s, status, detail}` objects, with nonempty status/detail text up to 500 characters. Status strings retain producer semantics. Before the first event the UI says “Not yet recorded”.
- metrics: object allowing nullable `ttft_ms`, `tpot_ms`, `tokens` (nonnegative). Missing fields are unknown. Transport streams cannot contain any non-null inference metrics.
- metrics_at_s: nullable availability timestamp. Required non-null if any metric is available. The UI withholds metrics until that time. Export when the aggregate is valid, typically completion, so final timing does not appear before it was observed.

Recorded packet release/arrival/completion is insufficient evidence of TTFT, token count or GPU execution. The bundled handoff carries recorded bytes in an offline transport fixture, not real inference timings.

## Ground-access traces

`{id, label, source, rate_semantics, delay_semantics, samples}`

Source must reference measured_ground_trace. Ground traces have no node or satellite association. They remain separate from optical links. Multiple traces in one file must declare a compatible time basis; otherwise export separate replays. The bundled datasets are separate exports and are never clock-aligned to HCW, each other, or an inference run.

`rate_semantics`: `service_opportunities`, `achieved_receive_rate` or `unavailable`. `delay_semantics`: `emulator_input`, `measured_owd` or `unavailable`. Unavailable semantics prohibit non-null corresponding values. The UI labels service-opportunity proxy and achieved receive rate explicitly; neither is physical capacity.

Ground sample fields: required `t_s`, optional nullable `bandwidth_bps`, `delay_ms`, `queue_bytes`, `loss_fraction` (0–1), `sent_packets`, `lost_packets`. All are nonnegative. Same-time/holding rules are the same as link samples. Counts belong to the same send-time bin as the loss fraction. Record bin width/window in provenance. Unknown/empty bins are null. Loss is not zero when no packets were sent.

LeoCC A1 downlink display export: 100 ms bins over common [0,119.99 s), final 90 ms bin; 1500-byte opportunities divided by actual bin width. Duplicate source events are counted. Delay is the bin mean of released 10 ms emulator inputs derived from RTT; not directly measured OWD or pure propagation. No loss/queue invented. A final all-null snapshot closes the valid interval.

Dissecting the StarLink export: separate 60 s low-rate UDP downlink record, 500 ms send-time bins, mean successful OWD and lost/sent. Original UTC origin 2026-01-11T13:51:47.002587086Z. All 55076 sends and 26 losses retained in aggregate counts. Low-rate probes do not measure capacity; bandwidth is null. No heavy uplink flow is combined with this record. Attribution: Cech, Mohan & Ott, TUM dataset DOI 10.14459/2026mp1856124, CC BY 4.0.

## Event log

Chronological `{t_s, label, source}`. Source must resolve. Events may share timestamps and retain input order. “Next event” selects the next strictly greater timestamp; same-time events are all shown together. Exact rational core times become binary64 at export, so the GUI is not an independent exact-clock auditor. Numeric seek and event buttons are available for microsecond-scale transport fixtures whose events cannot be separated using the full-horizon slider.

## Small valid import

```json
{
  "schema": "orbital-replay/v1",
  "title": "Illustrative two-node motion",
  "mode": "illustrative",
  "duration_s": 10,
  "provenance": [
    {"id":"demo","label":"Illustrative positions","kind":"illustrative","description":"Generated local coordinates, not actual satellite motion."}
  ],
  "nodes": [
    {"id":"a","label":"Sat A","position_source":"demo","positions":[{"t_s":0,"rtn_m":[0,0,0]},{"t_s":10,"rtn_m":[100,0,0]}]},
    {"id":"b","label":"Sat B","position_source":"demo","positions":[{"t_s":0,"rtn_m":[0,200,0]},{"t_s":10,"rtn_m":[0,100,0]}]}
  ],
  "links": [{"id":"ab","src":"a","dst":"b","source":"demo","samples":[]}],
  "requests": [],
  "ground_traces": [],
  "events": []
}
```

Convert a reviewed orbital_core schema-2 ledger with `python3 scripts/export_ledger.py /absolute/path/ledger.jsonl my-replay.json`. The converter supports `hcw-rtn-v1` and positionless `static-d/c`; it fails on unknown geometry. It never runs core simulation, network emulation, upstream code or GPU work. Supply actual inference timings and independent trace exports through the contract above. Validate an export with `node scripts/validate.mjs my-replay.json`.
