# Ayoub Afi — Personal Portfolio

Static, build-free portfolio for network engineer Ayoub Afi: [published site](https://afiay.github.io/portfolio/).

## Local preview

From the repository root:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000/`. Alternatively open `index.html` directly. No third-party fonts, frameworks, analytics or hosted runtime are required.

## Contents

- `index.html` and `style.css` — a personal homepage built around Ayoub's multi-industry career and deliberate choice of IT, with a conceptual network illustration, context-labeled projects, a Selected Work **Network Labs** view and source-backed engineering notes.
- `app.js` — phone/tablet navigation with keyboard focus containment, selected-work filters and Labs view switching, deep-link activation, copy-email and section highlighting.
- `lab-data.js` — three normalized lab topologies (individual physical cables, separate logical overlays, steps and evidence qualifiers).
- `labs.js` — zero-dependency interactive SVG rendering, lab/step selection, guided playback, clickable link/device details and reduced-motion behavior.
- `assets/ayoub-afi-profile.png` — user-provided portrait photograph in the hero.
- The About section is intentionally image-free and editorial. The previous generated full-body portrait was removed following Ayoub's review; the user-provided profile photo remains in the compact hero.
- The standalone CV page was removed at Ayoub's request. Education certificates and project evidence remain available.
- `assets/network-topology*.svg` — responsive animated enterprise diagrams.
- `assets/certificates/` — public, privacy-redacted diplomas and course certificates. Cisco course completions are not professional certification claims.
- `tests/portfolio.test.mjs`, `tests/project-views.test.mjs`, `tests/mobile-navigation.test.mjs`, `tests/lab-data.test.mjs`, `tests/labs-interaction.test.mjs` — zero-dependency presentation, Selected Work view switching, keyboard navigation, interaction and exact-cable-graph checks.

## Network Engineering Labs

Select **Network Labs** in the **Selected Work** filter bar, use **Labs** in the main navigation, or follow the hero's network labs link. The standalone labs section and duplicate network lab project card have been removed; the full interactive lab explorer is preserved inside Selected Work. The other Selected Work filters are **Software** and **Automation**, with **All projects** to restore the complete project grid.

1. Choose **01 Switching & VLANs**, **02 Routing & IPv6**, or **03 Multi-site Resilience**.
2. Use the protocol steps at right, the Play/Pause control, and the previous/next arrows. On the connectivity steps, a teal marker follows the selected, source-backed physical cable path (including one actual member of an EtherChannel) rather than a fabricated shortcut.
3. Select any SVG switch, router, host or physical link to see its role, available port labels and source context.
   On a phone, swipe horizontally within the scrollable topology. The diagram can also be focused from the keyboard and scrolled with the keyboard's usual scroll controls.
4. Expand **Physical link inventory** below the drawing to inspect every cable, with exact interface pairs available for Lab 03.
5. Compare **Observed evidence**, **Configuration excerpt**, and **Assignment requirement** badges; these represent different levels of substantiation.
6. Once published, use **Copy link to this lab** to send a colleague directly to Lab 01, 02 or 03. URL query parameters such as `?lab=lab-03#labs` restore the selected tab on page load; local/private preview links are not presented as public share links.

The cable counts are intentional and tested against the submitted diagrams:

| Lab | Physical cables | Connections |
| --- | ---: | --- |
| 01 | 7 | D1–A1 ×2 (Po1 PAgP); D1–A2 ×2 (Po2 LACP); A1–A2 ×1; A1–PC1 ×1; A2–PC2 ×1 |
| 02 | 9 | C1–D1, C1–D2, D1–D2 ×1 each; D1–A1 and D2–A1 ×2 each; A1–PC1 and A1–PC2 ×1 each |
| 03 | 14 | ISP–R1, ISP–R2; R1–D1/D2; R2–D3/D4; D1–A1 ×2; D2–A1 ×2; D3–A2 ×1; D4–A2 ×1; A1–PC1; A2–PC2 |

For Lab 03, physical ports were taken from the 11-node/14-link `project.gns3` manifest in the provided GNS3 project. **R1–R2 GRE is a logical tunnel, not a physical connection.** D1–D2 and D3–D4 are not physically connected in that lab. The second lab's `Loopback0` is also logical rather than a cable.

Motion is a teaching illustration, **not live telemetry or a recorded packet path**. The switching screenshots substantiate Lab 01's bundled ports, VLAN 10/20 root status and 4/4 PC pings. Lab 02's shown D1/C1 IPv6 routing configurations differ; the explorer does not claim proven end-to-end IPv6 reachability. Lab 03 screenshots show BGP, GRE and gateway states, but not a measured failover event. Original source files and assignment device passwords are **not publicly bundled**.

The site uses `prefers-reduced-motion`: when the visitor requests reduced motion, lab playback begins paused and moving SVG strokes and packet markers are disabled. Inspecting a device or cable pauses autoplay so the details stay visible.

## Verification

```bash
node tests/portfolio.test.mjs
node tests/project-views.test.mjs
node tests/mobile-navigation.test.mjs
node tests/lab-data.test.mjs
node tests/labs-interaction.test.mjs
node --check app.js
node --check lab-data.js
node --check labs.js
git diff --check
```

Before publishing, manually check desktop/mobile navigation, project filters, lab tabs and playback, selectable devices and cables, keyboard focus, expanding each engineering-note disclosure, mailto links, network illustration motion and reduced-motion behavior. Confirm that the narrative still matches the user's approved public facts. Because the lab SVGs are generated from a strict graph, review the labels and presentation in a full browser as well as the contract tests.

## Publishing

This repository targets GitHub Pages and is designed to work without a build step. The `main` branch is production; develop in a feature branch, review changes, then merge and publish via the repository's configured Pages workflow.

## Editorial principles

- Tell Ayoub's story through his actual decisions, constraints and lessons learned.
- Distinguish study labs, internships, independent products and methodology proposals.
- Do not claim production deployment, measured improvements, test passing or certified credentials without evidence.
- Carthago code is [publicly viewable](https://github.com/afiay/Carthago-Network-Security-Monitor); it is an evolving project, not a validated defensive product.
- Keep the contact section focused on practical conversations and relevant network engineering opportunities.
- Attribute third-party survey figures in engineering notes, with sample size and vendor context.
