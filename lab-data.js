/*
 * Exact physical adjacency from the three submitted lab diagrams. Lab 03 port
 * labels are transcribed from project.gns3 inside the original GNS3 archive.
 * Logical features (Loopback0, GRE, VLANs, routing) are NOT physical cables.
 */
(function (root) {
  'use strict';

  const node = (id, x, y, kind, role, detail, vlan) => ({ id, x, y, kind, role, detail, ...(vlan ? { vlan } : {}) });
  const edge = (id, from, to, extra = {}) => ({ id, from, to, ...extra });

  const labs = [
    {
      id: 'lab-01', number: '01', short: 'Switching & VLANs', title: 'Switching, Segmentation & STP',
      subtitle: 'Three switches, two EtherChannels, three VLANs and one verified host-to-host test.',
      platform: 'Cisco Packet Tracer', context: 'Educational switching simulation',
      tags: ['VLAN / VTP', 'Rapid PVST+', 'PAgP', 'LACP', '802.1Q'],
      nodes: [
        node('D1', 500, 115, 'switch', 'Distribution · STP root', 'VTP VLAN source. Captured outputs show D1 as root for VLANs 10 and 20.'),
        node('A1', 258, 342, 'switch', 'Access switch', 'Access switch connected to D1 by the two physical members of Po1 (PAgP).'),
        node('A2', 742, 342, 'switch', 'Access switch', 'Access switch connected to D1 by the two physical members of Po2 (LACP).'),
        node('PC1', 258, 545, 'pc', 'VLAN 10 · PERSONAL', '192.168.10.1/24. Connected directly to A1.', 10),
        node('PC2', 742, 545, 'pc', 'VLAN 10 · PERSONAL', '192.168.10.2/24. Connected directly to A2.', 10),
      ],
      physicalLinks: [
        edge('l1-pagp-1', 'D1', 'A1', { bundle: 'Po1', protocol: 'PAgP', member: 1, group: 'link-aggregation' }),
        edge('l1-pagp-2', 'D1', 'A1', { bundle: 'Po1', protocol: 'PAgP', member: 2, group: 'link-aggregation' }),
        edge('l1-lacp-1', 'D1', 'A2', { bundle: 'Po2', protocol: 'LACP', member: 1, group: 'link-aggregation' }),
        edge('l1-lacp-2', 'D1', 'A2', { bundle: 'Po2', protocol: 'LACP', member: 2, group: 'link-aggregation' }),
        edge('l1-a1-a2', 'A1', 'A2', { group: 'inter-switch', note: 'One physical link; the lab does not establish its exact forwarding state.' }),
        edge('l1-pc1', 'A1', 'PC1', { group: 'access', protocol: 'VLAN 10' }),
        edge('l1-pc2', 'A2', 'PC2', { group: 'access', protocol: 'VLAN 10' }),
      ],
      logicalOverlays: [],
      steps: [
        { title: 'Segment the LAN', short: 'VLAN 10 / 20 / 30', body: 'Define VLAN 10 PERSONAL, VLAN 20 STUDENTS and VLAN 30 GUESTS on D1, then distribute the VLAN database using VTP. Both PCs are access hosts in VLAN 10.', status: 'configured', highlightLinks: ['l1-pc1', 'l1-pc2'], inspect: 'D1' },
        { title: 'Negotiate redundant uplinks', short: 'Po1 PAgP · Po2 LACP', body: 'Two physical members form Po1 between D1 and A1 via PAgP; two other members form Po2 between D1 and A2 via LACP. The CLI summary shows both channels up/in use (SU).', status: 'verified', highlightLinks: ['l1-pagp-1', 'l1-pagp-2', 'l1-lacp-1', 'l1-lacp-2'], inspect: 'D1' },
        { title: 'Control the spanning tree', short: 'Rapid PVST+ · D1 root', body: 'Configure Rapid PVST+ and root/edge safeguards. The provided show spanning-tree output confirms D1 is root for VLAN 10 and VLAN 20; it does not prove the root state for VLAN 30 or individual guard settings.', status: 'verified', highlightLinks: ['l1-a1-a2', 'l1-pagp-1', 'l1-lacp-1'], inspect: 'D1' },
        { title: 'Validate PC connectivity', short: 'PC1 → PC2 · 4/4 replies', body: 'The lab screenshots show four ICMP echo replies between PC1 and PC2 (0% loss). The highlighted route is illustrative; the screenshots do not record a packet-by-packet forwarding path.', status: 'verified', highlightLinks: ['l1-pc1', 'l1-pagp-1', 'l1-lacp-1', 'l1-pc2'], packetRoute: ['PC1', 'A1', 'D1', 'A2', 'PC2'], inspect: 'PC2' },
      ],
      evidence: [
        { command: 'D1# show etherchannel summary', text: 'Po1(SU) · PAgP  |  Po2(SU) · LACP', status: 'verified' },
        { command: 'D1# show spanning-tree vlan 10 / 20', text: 'This bridge is the root (both VLANs)', status: 'verified' },
        { command: 'A2# show vlan brief', text: 'VLAN 10 PERSONAL · 20 STUDENTS · 30 GUESTS active', status: 'verified' },
        { command: 'PC1> ping 192.168.10.2', text: '4/4 replies · 0% packet loss', status: 'verified' },
      ],
      notes: ['A1–A2 is exactly one physical link, not another EtherChannel.', 'Physical cable presence does not establish its current STP forwarding state.', 'Root-guard, PortFast and BPDU-guard were assignment objectives; individual activation was not independently verified in the provided screenshots.'],
    },
    {
      id: 'lab-02', number: '02', short: 'Routing & IPv6', title: 'Dual-stack Routing & Switching',
      subtitle: 'Three routed core links, two switch bundles and separate host VLANs.',
      platform: 'Cisco Packet Tracer', context: 'Educational routing simulation',
      tags: ['EIGRP', 'IPv6 OSPF', 'VLAN 10 / 20', 'EtherChannel', 'IPv4 / IPv6'],
      nodes: [
        node('C1', 500, 84, 'router', 'Core router', 'Links to D1 and D2, plus logical Loopback0 (IPv4 100.100.100.100/32; IPv6 2001:0::100/128).'),
        node('D1', 270, 254, 'switch', 'Distribution / Layer 3', 'Routed connections to C1 and D2. VLAN 10 and 20 SVIs; the screenshot configuration shows EIGRP 100 for IPv4 and OSPF for IPv6.'),
        node('D2', 730, 254, 'switch', 'Distribution / Layer 3', 'Routed connections to C1 and D1, with a bundled uplink to A1.'),
        node('A1', 500, 452, 'switch', 'Access switch', 'Po1 to D1 and Po2 to D2; VLAN 10 and VLAN 20 access hosts.'),
        node('PC1', 348, 568, 'pc', 'VLAN 10 · PERSONAL', 'VLAN 10 client, dual-stack addressing required by the assignment.', 10),
        node('PC2', 652, 568, 'pc', 'VLAN 20 · STUDENTS', 'VLAN 20 client, dual-stack addressing required by the assignment.', 20),
      ],
      physicalLinks: [
        edge('l2-c1-d1', 'C1', 'D1', { group: 'routed' }),
        edge('l2-c1-d2', 'C1', 'D2', { group: 'routed' }),
        edge('l2-d1-d2', 'D1', 'D2', { group: 'routed', note: '10.0.3.0/30 inter-distribution link in assignment.' }),
        edge('l2-po1-1', 'D1', 'A1', { bundle: 'Po1', protocol: 'EtherChannel', member: 1 }),
        edge('l2-po1-2', 'D1', 'A1', { bundle: 'Po1', protocol: 'EtherChannel', member: 2 }),
        edge('l2-po2-1', 'D2', 'A1', { bundle: 'Po2', protocol: 'EtherChannel', member: 1 }),
        edge('l2-po2-2', 'D2', 'A1', { bundle: 'Po2', protocol: 'EtherChannel', member: 2 }),
        edge('l2-pc1', 'A1', 'PC1', { group: 'access', protocol: 'VLAN 10' }),
        edge('l2-pc2', 'A1', 'PC2', { group: 'access', protocol: 'VLAN 20' }),
      ],
      logicalOverlays: [],
      steps: [
        { title: 'Connect the routed core', short: 'C1 ↔ D1 / D2; D1 ↔ D2', body: 'C1 has a physical link to each distribution switch, and D1 has a separate physical interconnection to D2. Loopback0 is a logical router interface, not a fourth cable.', status: 'configured', highlightLinks: ['l2-c1-d1', 'l2-c1-d2', 'l2-d1-d2'], inspect: 'C1' },
        { title: 'Bundle access uplinks', short: 'Po1 & Po2 · 802.1Q trunks', body: 'A1 uses two cable members to D1 and two to D2, aggregated as separate EtherChannels. VLAN 10 is PERSONAL and VLAN 20 is STUDENTS.', status: 'configured', highlightLinks: ['l2-po1-1', 'l2-po1-2', 'l2-po2-1', 'l2-po2-2'], inspect: 'A1' },
        { title: 'Configure IP routing', short: 'EIGRP IPv4 · IPv6 OSPF configuration', body: 'D1 configuration includes EIGRP 100 for IPv4 and OSPF on IPv6 interfaces. C1 configuration shows IPv6 EIGRP, so these screenshots alone do not demonstrate a consistent IPv6 routing adjacency between C1 and D1.', status: 'configured', highlightLinks: ['l2-c1-d1', 'l2-c1-d2', 'l2-d1-d2'], inspect: 'D1' },
        { title: 'Verify reachability', short: 'PC ↔ PC; PCs → C1 Loopback0', body: 'The assignment requests IPv4 and IPv6 pings between PC1 and PC2 and to Loopback0 on C1, plus routing-table and trunk checks. The available evidence does not establish every requested path as proven; the animation is illustrative.', status: 'required', highlightLinks: ['l2-pc1', 'l2-pc2', 'l2-po1-1', 'l2-c1-d1'], inspect: 'PC1' },
      ],
      evidence: [
        { command: 'D1# show running-config', text: 'router eigrp 100 · VLAN 10/20 SVIs', status: 'configured' },
        { command: 'D1# show running-config', text: 'ipv6 ospf 1 area 0 · channel-group 1 mode active', status: 'configured' },
        { command: 'C1# show running-config', text: 'Loopback0 100.100.100.100/32 · IPv6 EIGRP 100', status: 'configured' },
        { command: 'Assignment checklist', text: 'Verify routing tables, trunks, and PC/loopback pings', status: 'required' },
      ],
      notes: ['D1 and C1 screenshot configurations show different IPv6 routing protocols; end-to-end IPv6 interoperability is not proven by those excerpts.', 'Po1 and Po2 each consist of two physical cables.', 'C1 Loopback0 is a logical interface, never a physical topology link.'],
    },
    {
      id: 'lab-03', number: '03', short: 'Multi-site Resilience', title: 'Advanced Routing & Redundancy',
      subtitle: 'Two branch networks, three eBGP sites, first-hop redundancy and a logical GRE tunnel.',
      platform: 'GNS3', context: 'Educational multi-site network simulation',
      tags: ['eBGP', 'EIGRP / OSPF', 'HSRP / VRRP', 'GRE tunnel', 'IPv4 / IPv6'],
      nodes: [
        node('ISP', 500, 68, 'router', 'Hudik ISP · AS65200', 'Internet-facing site router connected physically only to R1 and R2.'),
        node('R1', 236, 183, 'router', 'Gävle · AS65100', 'Site 1 router: eBGP toward ISP; internal routing with EIGRP; logical GRE endpoint.'),
        node('R2', 764, 183, 'router', 'Övik · AS65300', 'Site 2 router: eBGP toward ISP; internal routing with OSPF; logical GRE endpoint.'),
        node('D1', 120, 315, 'switch', 'Gävle distribution', 'R1 uplink and two parallel physical cables toward A1.'),
        node('D2', 352, 315, 'switch', 'Gävle distribution', 'R1 uplink and two parallel physical cables toward A1.'),
        node('D3', 648, 315, 'switch', 'Övik distribution', 'R2 uplink and exactly one trunk to A2.'),
        node('D4', 880, 315, 'switch', 'Övik distribution', 'R2 uplink and exactly one trunk to A2.'),
        node('A1', 236, 470, 'switch', 'Gävle access', 'Two uplink members from D1 and two from D2; PC1 is connected to A1.'),
        node('A2', 764, 470, 'switch', 'Övik access', 'One cable from D3 and one from D4; PC2 is connected to A2.'),
        node('PC1', 236, 561, 'pc', 'Gävle host', '192.168.1.0/24 site (assignment) behind A1.'),
        node('PC2', 764, 561, 'pc', 'Övik host', '192.168.2.0/24 site (assignment) behind A2.'),
      ],
      physicalLinks: [
        edge('l3-isp-r1', 'ISP', 'R1', { fromPort: 'Gi0/0', toPort: 'Gi0/0', protocol: 'eBGP' }),
        edge('l3-isp-r2', 'ISP', 'R2', { fromPort: 'Gi0/1', toPort: 'Gi0/0', protocol: 'eBGP' }),
        edge('l3-r1-d1', 'R1', 'D1', { fromPort: 'Gi0/1', toPort: 'Gi0/0', protocol: 'EIGRP' }),
        edge('l3-r1-d2', 'R1', 'D2', { fromPort: 'Gi0/2', toPort: 'Gi0/0', protocol: 'EIGRP' }),
        edge('l3-r2-d3', 'R2', 'D3', { fromPort: 'Gi0/1', toPort: 'Gi0/0', protocol: 'OSPF' }),
        edge('l3-r2-d4', 'R2', 'D4', { fromPort: 'Gi0/2', toPort: 'Gi0/0', protocol: 'OSPF' }),
        edge('l3-d1-a1-1', 'D1', 'A1', { fromPort: 'Gi0/1', toPort: 'Gi0/0', bundle: 'Gävle Po1', member: 1 }),
        edge('l3-d1-a1-2', 'D1', 'A1', { fromPort: 'Gi0/3', toPort: 'Gi0/2', bundle: 'Gävle Po1', member: 2 }),
        edge('l3-d2-a1-1', 'D2', 'A1', { fromPort: 'Gi0/1', toPort: 'Gi0/1', bundle: 'Gävle Po2', member: 1 }),
        edge('l3-d2-a1-2', 'D2', 'A1', { fromPort: 'Gi0/3', toPort: 'Gi0/3', bundle: 'Gävle Po2', member: 2 }),
        edge('l3-d3-a2', 'D3', 'A2', { fromPort: 'Gi0/1', toPort: 'Gi0/1', protocol: 'trunk' }),
        edge('l3-d4-a2', 'D4', 'A2', { fromPort: 'Gi0/1', toPort: 'Gi0/2', protocol: 'trunk' }),
        edge('l3-a1-pc1', 'A1', 'PC1', { fromPort: 'Gi1/0', toPort: 'e0', group: 'access' }),
        edge('l3-a2-pc2', 'A2', 'PC2', { fromPort: 'Gi0/0', toPort: 'e0', group: 'access' }),
      ],
      logicalOverlays: [
        { id: 'overlay-gre', from: 'R1', to: 'R2', kind: 'gre', label: 'GRE tunnel · logical overlay (NOT A CABLE)' },
      ],
      steps: [
        { title: 'Build two site domains', short: 'Gävle · Övik', body: 'Two branch LANs connect through the ISP. Gävle: R1, D1, D2, A1, PC1; Övik: R2, D3, D4, A2, PC2. Four physical uplink members connect Gävle distribution to A1, while Övik uses one cable from each distribution switch to A2.', status: 'configured', highlightLinks: ['l3-r1-d1', 'l3-r1-d2', 'l3-r2-d3', 'l3-r2-d4', 'l3-d1-a1-1', 'l3-d1-a1-2', 'l3-d2-a1-1', 'l3-d2-a1-2', 'l3-d3-a2', 'l3-d4-a2'], inspect: 'R1' },
        { title: 'Establish site routing', short: 'eBGP · EIGRP · OSPF', body: 'R1 and R2 each connect directly to ISP via eBGP-facing physical links. Gävle uses EIGRP internally; Övik uses OSPF internally. Routing-table evidence is included in the submitted screenshots.', status: 'verified', highlightLinks: ['l3-isp-r1', 'l3-isp-r2', 'l3-r1-d1', 'l3-r1-d2', 'l3-r2-d3', 'l3-r2-d4'], inspect: 'ISP' },
        { title: 'Inspect first-hop redundancy', short: 'HSRP active · VRRP master', body: 'The screenshot evidence shows HSRP Active and VRRP Master role states on the two LANs. These are observed gateway states, not a timed failover benchmark.', status: 'verified', highlightLinks: ['l3-d1-a1-1', 'l3-d2-a1-1', 'l3-d3-a2', 'l3-d4-a2'], inspect: 'D1' },
        { title: 'Tunnel between site routers', short: 'GRE over the ISP underlay', body: 'The GRE R1⇢R2 tunnel is a *logical* overlay over the routed ISP network. There is NO directly connected cable from R1 to R2 in the source GNS3 project. Interface screenshots report the tunnel up/up.', status: 'verified', highlightLinks: ['l3-isp-r1', 'l3-isp-r2'], highlightOverlays: ['overlay-gre'], inspect: 'R2' },
        { title: 'Verify end-to-end paths', short: 'Ping · trace · routing state', body: 'Screenshots include route, interface and connectivity evidence. Packet motion is a teaching illustration through the physical ISP underlay, never a replay of captured packets or proof of a failover timing.', status: 'verified', highlightLinks: ['l3-a1-pc1', 'l3-d1-a1-1', 'l3-r1-d1', 'l3-isp-r1', 'l3-isp-r2', 'l3-r2-d3', 'l3-d3-a2', 'l3-a2-pc2'], packetRoute: ['PC1', 'A1', 'D1', 'R1', 'ISP', 'R2', 'D3', 'A2', 'PC2'], inspect: 'PC2' },
      ],
      evidence: [
        { command: 'BGP / route-table outputs', text: 'eBGP and learned routes visible in screenshots', status: 'verified' },
        { command: 'Port-channel summary', text: 'LACP member bundles shown on Gävle LAN', status: 'verified' },
        { command: 'FHRP inspection', text: 'HSRP Active · VRRP Master shown', status: 'verified' },
        { command: 'Tunnel / interfaces', text: 'GRE tunnel interfaces shown up/up', status: 'verified' },
        { command: 'Assignment checklist', text: 'Traceroute and host path checks; failover timing not measured', status: 'required' },
      ],
      notes: ['R1–R2 is GRE over an ISP path, not a physical cable.', 'The GNS3 project contains 14 physical links and 11 nodes.', 'Observed gateway roles are not proof of a successful failover test; failover was not measured.'],
    },
  ];

  function getLab(id) { return labs.find((lab) => lab.id === id) || null; }

  function physicalCounts(id) {
    const lab = getLab(id);
    if (!lab) return {};
    const counts = {};
    for (const { from, to } of lab.physicalLinks) {
      const key = [from, to].sort().join('—');
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, 'en')));
  }

  const api = { labs, getLab, physicalCounts };
  root.PortfolioLabData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
