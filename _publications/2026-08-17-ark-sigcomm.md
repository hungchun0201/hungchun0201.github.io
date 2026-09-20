---
title: 'ARK: Avoiding Routing Collisions for KV Cache Transfer in Disaggregated LLM Inference'
collection: publications
permalink: /publication/2026-08-17-ark-sigcomm
date: 2026-08-17
publication_type: conference
authors: ['Hung-Chun Lin', 'Ting-Wei Hsu', 'Chung-En Ho', 'Ahmed Saeed']
venue: 'Proceedings of the ACM SIGCOMM 2026 Conference'
pages: '2067–2073'
paperurl: 'https://dl.acm.org/doi/10.1145/3789240.3828750'
doi: '10.1145/3789240.3828750'
scholar_url: 'https://scholar.google.com/citations?view_op=view_citation&user=_Y-8ak0AAAAJ&citation_for_view=_Y-8ak0AAAAJ:zYLM7Y9cAGgC&hl=en'
excerpt: 'ARK coordinates network paths for KV-cache transfers in disaggregated LLM inference, reducing routing collisions without changes to network switches.'
citation: 'Hung-Chun Lin, Ting-Wei Hsu, Chung-En Ho, and Ahmed Saeed. &quot;ARK: Avoiding Routing Collisions for KV Cache Transfer in Disaggregated LLM Inference.&quot; <i>Proceedings of the ACM SIGCOMM 2026 Conference</i>, pp. 2067–2073, 2026. DOI: 10.1145/3789240.3828750.'
---

ARK coordinates network paths for KV-cache transfers in disaggregated LLM inference. It reserves distinct paths for concurrent, long-lived transfers by choosing source ports that map to different spine switches, reducing routing collisions without switch modifications or receiver-side packet reordering.
