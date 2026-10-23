/* Source-backed diagrams and educational playback for Ayoub's network labs.
 * Solid SVG paths are physical cables. GRE is an explicitly logical overlay.
 */
(function (root) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const data = root.PortfolioLabData;

  function stepIndex(current, delta, total) {
    return total > 0 ? ((current + delta) % total + total) % total : 0;
  }

  function deviceName(node) { return `${node.id} · ${node.role}`; }

  function linkEndpoints(link, nodes) {
    const from = nodes.find((node) => node.id === link.from);
    const to = nodes.find((node) => node.id === link.to);
    if (!from || !to) throw new Error(`Unknown physical endpoint: ${link.from} → ${link.to}`);
    const dx = to.x - from.x, dy = to.y - from.y;
    const magnitude = Math.hypot(dx, dy);
    const offset = link.member === 1 ? -7 : link.member === 2 ? 7 : 0;
    const nx = magnitude ? -dy / magnitude : 0;
    const ny = magnitude ? dx / magnitude : 0;
    const round = (value) => Number(value.toFixed(2));
    return {
      from: { x: round(from.x + nx * offset), y: round(from.y + ny * offset) },
      to: { x: round(to.x + nx * offset), y: round(to.y + ny * offset) },
    };
  }

  function linkPath(link, nodes) {
    const points = linkEndpoints(link, nodes);
    return `M ${points.from.x} ${points.from.y} L ${points.to.x} ${points.to.y}`;
  }

  function routeEdges(sequence, physicalLinks) {
    if (!Array.isArray(sequence) || sequence.length < 2) return [];
    const matches = [];
    for (let index = 1; index < sequence.length; index += 1) {
      const from = sequence[index - 1], to = sequence[index];
      const edge = physicalLinks.find((link) =>
        (link.from === from && link.to === to) || (link.from === to && link.to === from));
      if (!edge) return null;
      matches.push(edge.id);
    }
    return matches;
  }

  function packetPath(sequence, lab) {
    const matched = routeEdges(sequence, lab.physicalLinks);
    if (!matched) return null;
    const points = [];
    const push = (point) => {
      const last = points[points.length - 1];
      if (!last || last.x !== point.x || last.y !== point.y) points.push(point);
    };
    const first = lab.nodes.find((node) => node.id === sequence[0]);
    if (!first) return null;
    push(first);
    for (let index = 0; index < matched.length; index += 1) {
      const cable = lab.physicalLinks.find((link) => link.id === matched[index]);
      const destination = lab.nodes.find((node) => node.id === sequence[index + 1]);
      if (!cable || !destination) return null;
      const endpoints = linkEndpoints(cable, lab.nodes);
      const forward = cable.from === sequence[index];
      push(forward ? endpoints.from : endpoints.to);
      push(forward ? endpoints.to : endpoints.from);
      push(destination);
    }
    return points.map(({ x, y }, index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
  }

  function labUrl(pageUrl, id, getLab) {
    if (!getLab(id)) return null;
    try {
      const url = new URL(pageUrl);
      url.searchParams.set('lab', id);
      url.hash = 'labs';
      return url.toString();
    } catch (_) { return null; }
  }

  function selectedLabId(pageUrl, getLab) {
    try {
      const id = new URL(pageUrl).searchParams.get('lab');
      return getLab(id) ? id : 'lab-01';
    } catch (_) { return 'lab-01'; }
  }

  function publicLabUrl(pageUrl, id, getLab) {
    try {
      const url = new URL(pageUrl);
      const host = url.hostname.toLowerCase();
      if (!['https:', 'http:'].includes(url.protocol) ||
          host === 'localhost' || host === '127.0.0.1' || host === '[::1]' ||
          host.endsWith('.local') || /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
      return labUrl(pageUrl, id, getLab);
    } catch (_) { return null; }
  }

  function replaceLabHistory(history, address) {
    try {
      history.replaceState(null, '', address);
      return true;
    } catch (_) { return false; }
  }

  const api = { linkPath, packetPath, routeEdges, stepIndex, deviceName, labUrl, publicLabUrl, selectedLabId, replaceLabHistory };
  root.PortfolioLabExplorer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document === 'undefined' || !data) return;
  const section = document.getElementById('labs');
  if (!section) return;

  const byId = (id) => document.getElementById(id);
  const svg = byId('lab-topology');
  const stage = byId('lab-explorer');
  const labButtons = Array.from(section.querySelectorAll('[data-lab]'));
  const stepList = byId('lab-steps');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let currentLab = data.getLab('lab-01');
  let currentStep = 0;
  let selectedItem = null;
  let isPlaying = !reducedMotionQuery.matches;
  let timerId = null;

  function svgElement(tag, attrs = {}, content) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (content !== undefined) element.textContent = content;
    return element;
  }

  function addText(parent, x, y, label, className = 'lab-graph-label', extra = {}) {
    const element = svgElement('text', { x, y, class: className, 'text-anchor': 'middle', ...extra }, label);
    parent.append(element);
    return element;
  }

  function inspect(title, description) {
    const container = byId('lab-inspector');
    container.replaceChildren();
    const heading = document.createElement('strong');
    const paragraph = document.createElement('p');
    heading.textContent = title;
    paragraph.textContent = description;
    container.append(heading, paragraph);
  }

  function makeKeyboardAction(element, handler) {
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.addEventListener('click', handler);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handler();
      }
    });
  }

  function drawBackground(lab) {
    if (lab.id !== 'lab-03') return;
    const backdrop = svgElement('g', { 'aria-hidden': 'true' });
    for (const site of [{ x: 25, label: 'GÄVLE / EIGRP' }, { x: 525, label: 'ÖVIK / OSPF' }]) {
      backdrop.append(svgElement('rect', { x: site.x, y: 137, width: 450, height: 485, rx: 24, fill: '#EAF5FB', opacity: 0.69 }));
      addText(backdrop, site.x + 76, 165, site.label, 'lab-graph-label', { 'font-size': 10 });
    }
    svg.append(backdrop);
  }

  function drawCables(lab, step) {
    const highlighted = new Set(step.highlightLinks || []);
    const illustratedRoute = new Set(step.packetRoute ? routeEdges(step.packetRoute, lab.physicalLinks) || [] : []);
    const group = svgElement('g', { 'aria-label': 'Physical cables', 'data-graph-layer': 'physical' });
    for (const link of lab.physicalLinks) {
      const isActive = highlighted.has(link.id);
      const d = linkPath(link, lab.nodes);
      const clickable = svgElement('g', { 'aria-label': `Physical cable ${link.from} to ${link.to}${link.bundle ? `, ${link.bundle}` : ''}` });
      clickable.append(svgElement('path', { d, class: `lab-cable ${isActive ? 'lab-cable-highlight' : 'lab-cable-muted'}`, 'data-physical-edge': link.id }));
      if (isActive && illustratedRoute.has(link.id)) clickable.append(svgElement('path', { d, class: 'lab-cable-glint is-active', 'aria-hidden': 'true' }));
      clickable.append(svgElement('path', { d, class: 'lab-cable-hit', 'aria-hidden': 'true' }));
      makeKeyboardAction(clickable, () => {
        setPlaying(false);
        selectedItem = link.id;
        const fromPort = link.fromPort ? ` ${link.fromPort}` : '';
        const toPort = link.toPort ? ` ${link.toPort}` : '';
        const label = `${link.from}${fromPort} ↔ ${link.to}${toPort}`;
        const message = `${link.bundle ? `Physical member ${link.member} of ${link.bundle}. ` : 'One physical cable. '}${link.protocol ? `Protocol/topic: ${link.protocol}. ` : ''}${link.note || 'Source: submitted lab topology.'}`;
        inspect(label, message);
        svg.querySelectorAll('.lab-cable-focus').forEach((element) => element.classList.remove('lab-cable-focus'));
        svg.querySelectorAll('.lab-node-selected').forEach((element) => element.classList.remove('lab-node-selected'));
        clickable.firstChild.classList.add('lab-cable-focus');
      });
      if (selectedItem === link.id) clickable.firstChild.classList.add('lab-cable-focus');
      group.append(clickable);
    }
    svg.append(group);
  }

  function drawCableLabels(lab) {
    const group = svgElement('g', { 'pointer-events': 'none', 'aria-hidden': 'true' });
    const named = new Set();
    for (const link of lab.physicalLinks) {
      const label = link.bundle ? `${link.bundle}${link.protocol && link.protocol !== 'EtherChannel' ? ` · ${link.protocol}` : ''}` : null;
      if (!label || named.has(link.bundle)) continue;
      named.add(link.bundle);
      const from = lab.nodes.find((node) => node.id === link.from);
      const to = lab.nodes.find((node) => node.id === link.to);
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      addText(group, midX, midY - 17, label);
    }
    if (lab.id === 'lab-01') addText(group, 500, 376, 'A1 ↔ A2 · one physical link', 'lab-graph-label');
    if (lab.id === 'lab-02') addText(group, 500, 278, 'D1 ↔ D2 · routed link', 'lab-graph-label');
    if (lab.id === 'lab-03') {
      addText(group, 348, 114, 'eBGP', 'lab-graph-label');
      addText(group, 652, 114, 'eBGP', 'lab-graph-label');
    }
    svg.append(group);
  }

  function drawLogicalOverlays(lab, step) {
    const highlighted = new Set(step.highlightOverlays || []);
    const group = svgElement('g', { 'data-graph-layer': 'logical', 'aria-label': 'Logical protocol overlays; not physical cables' });
    for (const overlay of lab.logicalOverlays) {
      const from = lab.nodes.find((node) => node.id === overlay.from);
      const to = lab.nodes.find((node) => node.id === overlay.to);
      if (!from || !to) continue;
      const midX = (from.x + to.x) / 2;
      const d = `M ${from.x} ${from.y} Q ${midX} ${from.y + 100} ${to.x} ${to.y}`;
      const wrapper = svgElement('g', { 'aria-label': overlay.label });
      wrapper.append(svgElement('path', { d, class: `lab-overlay ${highlighted.has(overlay.id) ? 'is-active' : ''}`, 'data-logical-overlay': overlay.id }));
      addText(wrapper, midX, from.y + 67, 'GRE · logical overlay (not a cable)', 'lab-overlay-label');
      makeKeyboardAction(wrapper, () => {
        setPlaying(false);
        inspect('GRE logical tunnel', 'R1 and R2 communicate using an IP tunnel over the ISP underlay. The original GNS3 file contains no direct R1–R2 physical connection.');
      });
      group.append(wrapper);
    }
    svg.append(group);
  }

  function drawPacketRoute(lab, step) {
    if (!step.packetRoute) return;
    const d = packetPath(step.packetRoute, lab);
    if (!d) return;
    svg.append(svgElement('path', { d, class: 'lab-packet-guide', 'aria-hidden': 'true' }));
    const marker = svgElement('circle', { r: 8, class: 'lab-packet-dot', 'aria-hidden': 'true' });
    marker.append(svgElement('animateMotion', { path: d, dur: '5s', repeatCount: 'indefinite', calcMode: 'linear' }));
    svg.append(marker);
  }

  function drawNodes(lab, step) {
    const group = svgElement('g', { 'aria-label': 'Network devices', 'data-graph-layer': 'devices' });
    for (const node of lab.nodes) {
      const selected = selectedItem === node.id || (!selectedItem && step.inspect === node.id);
      const wrapper = svgElement('g', {
        transform: `translate(${node.x} ${node.y})`,
        class: `lab-node lab-node-${node.kind}${selected ? ' lab-node-selected' : ''}`,
        'aria-label': deviceName(node),
      });
      if (node.kind === 'router') {
        wrapper.append(svgElement('ellipse', { cx: 0, cy: 0, rx: 33, ry: 26, class: 'lab-node-box' }));
        wrapper.append(svgElement('path', { d: 'M-18 0h36m-26-9-10 9 10 9m16-18 10 9-10 9', class: 'lab-node-icon' }));
      } else if (node.kind === 'switch') {
        wrapper.append(svgElement('rect', { x: -35, y: -24, width: 70, height: 48, rx: 9, class: 'lab-node-box' }));
        wrapper.append(svgElement('path', { d: 'M-23 -7H23m-38-8-8 8 8 8m30-16 8 8-8 8M-23 11H23', class: 'lab-node-icon' }));
      } else {
        wrapper.append(svgElement('rect', { x: -21, y: -22, width: 42, height: 32, rx: 4, class: 'lab-node-box' }));
        wrapper.append(svgElement('path', { d: 'M-13 16h26m-6-6v6m-14-6v6', class: 'lab-node-icon' }));
      }
      addText(wrapper, 0, 48, node.id, 'lab-node-text');
      if (node.vlan) addText(wrapper, 0, 65, `VLAN ${node.vlan}`, 'lab-node-subtext');
      makeKeyboardAction(wrapper, () => {
        setPlaying(false);
        selectedItem = node.id;
        inspect(deviceName(node), node.detail);
        svg.querySelectorAll('.lab-cable-focus').forEach((element) => element.classList.remove('lab-cable-focus'));
        svg.querySelectorAll('.lab-node-selected').forEach((element) => element.classList.remove('lab-node-selected'));
        wrapper.classList.add('lab-node-selected');
      });
      group.append(wrapper);
    }
    svg.append(group);
  }

  function renderDiagram() {
    const lab = currentLab;
    const step = lab.steps[currentStep];
    svg.replaceChildren();
    svg.append(svgElement('title', { id: 'lab-svg-title' }, `Lab ${lab.number} physical network: ${lab.title}`));
    svg.append(svgElement('desc', {}, 'Solid lines show real source-diagram physical cables. Paired lines show individual EtherChannel members. Dashed GRE is logical, not a cable. Select a device or cable for details.'));
    svg.setAttribute('aria-labelledby', 'lab-svg-title');
    drawBackground(lab);
    drawCables(lab, step);
    drawLogicalOverlays(lab, step);
    drawPacketRoute(lab, step);
    drawCableLabels(lab);
    drawNodes(lab, step);
  }

  function renderSteps() {
    stepList.replaceChildren();
    currentLab.steps.forEach((step, index) => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lab-step-btn';
      if (index === currentStep) button.setAttribute('aria-current', 'step');
      const count = document.createElement('span');
      count.className = 'lab-step-number';
      count.textContent = String(index + 1).padStart(2, '0');
      const info = document.createElement('span');
      info.className = 'lab-step-info';
      const title = document.createElement('strong');
      title.textContent = step.title;
      const brief = document.createElement('small');
      brief.textContent = step.short;
      info.append(title, brief);
      const badge = document.createElement('span');
      badge.className = `lab-step-badge${step.status === 'required' ? ' is-required' : ''}`;
      badge.textContent = step.status;
      button.append(count, info, badge);
      button.addEventListener('click', () => {
        setPlaying(false);
        chooseStep(index);
      });
      listItem.append(button);
      stepList.append(listItem);
    });
  }

  function renderEvidence() {
    const container = byId('lab-evidence');
    container.replaceChildren();
    currentLab.evidence.forEach((item) => {
      const block = document.createElement('div');
      block.className = 'lab-evidence-item';
      const command = document.createElement('code');
      command.textContent = item.command;
      const excerpt = document.createElement('p');
      excerpt.textContent = item.text;
      const state = document.createElement('span');
      state.className = item.status === 'required' ? 'is-required' : '';
      state.textContent = item.status === 'required' ? 'Assignment requirement' : item.status === 'verified' ? 'Observed evidence' : 'Configuration excerpt';
      block.append(command, excerpt, state);
      container.append(block);
    });
  }

  function renderInventory() {
    const container = byId('lab-physical-links');
    container.replaceChildren();
    byId('lab-link-count').textContent = `${currentLab.physicalLinks.length} cables`;
    currentLab.physicalLinks.forEach((link) => {
      const item = document.createElement('div');
      item.className = 'lab-inventory-row';
      item.setAttribute('role', 'listitem');
      const endpoints = document.createElement('strong');
      endpoints.textContent = `${link.from}${link.fromPort ? ' ' + link.fromPort : ''} ↔ ${link.to}${link.toPort ? ' ' + link.toPort : ''}`;
      const detail = document.createElement('small');
      detail.textContent = link.bundle ? `${link.bundle} / member ${link.member}${link.protocol ? ' / ' + link.protocol : ''}` : link.protocol || 'Single physical cable';
      item.append(endpoints, detail);
      container.append(item);
    });
  }

  function renderProgress() {
    const progress = byId('lab-progress');
    progress.replaceChildren();
    currentLab.steps.forEach((_, index) => {
      const segment = document.createElement('span');
      if (index <= currentStep) segment.className = 'is-complete';
      progress.append(segment);
    });
    byId('lab-progress-label').textContent = `${currentStep + 1} / ${currentLab.steps.length}`;
  }

  function renderStep() {
    const lab = currentLab;
    const step = lab.steps[currentStep];
    byId('lab-step-pill').textContent = `Step ${String(currentStep + 1).padStart(2, '0')} / ${String(lab.steps.length).padStart(2, '0')}`;
    byId('lab-active-step').textContent = step.title;
    byId('lab-playback-note').textContent = step.short + ' · illustrative walkthrough';
    byId('lab-diagram-caption').textContent = 'Physical cabling is source-backed. Motion and highlighted paths are illustrative, not live traffic.';
    renderSteps();
    renderProgress();
    renderDiagram();
    if (!selectedItem) inspect(step.title, step.body);
  }

  function chooseStep(index) {
    currentStep = Math.max(0, Math.min(index, currentLab.steps.length - 1));
    selectedItem = null;
    renderStep();
  }

  function synchronizePlaybackButton() {
    const button = byId('lab-play');
    button.setAttribute('aria-label', isPlaying ? 'Pause lab walkthrough' : 'Play lab walkthrough');
    button.setAttribute('aria-pressed', String(isPlaying));
    byId('lab-play-icon').textContent = isPlaying ? 'Ⅱ' : '▶';
    stage.classList.toggle('is-playing', isPlaying);
  }

  function restartTimer() {
    if (timerId !== null) { window.clearInterval(timerId); timerId = null; }
    if (!isPlaying || document.hidden || section.hidden) return;
    timerId = window.setInterval(() => {
      currentStep = stepIndex(currentStep, 1, currentLab.steps.length);
      selectedItem = null;
      renderStep();
    }, 6500);
  }

  function setPlaying(playing) {
    isPlaying = Boolean(playing && !reducedMotionQuery.matches);
    synchronizePlaybackButton();
    restartTimer();
  }

  function chooseLab(id, focus = false, syncUrl = false) {
    const next = data.getLab(id);
    if (!next) return;
    currentLab = next;
    currentStep = 0;
    selectedItem = null;
    byId('lab-share-status').textContent = '';
    if (syncUrl) {
      const destination = labUrl(window.location.href, id, data.getLab);
      if (destination) replaceLabHistory(window.history, destination);
    }
    labButtons.forEach((button) => {
      const active = button.dataset.lab === id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    stage.setAttribute('aria-labelledby', labButtons.find((button) => button.dataset.lab === id).id);
    byId('lab-kicker').textContent = `LAB ${next.number} / ${next.id === 'lab-01' ? 'SWITCHING' : next.id === 'lab-02' ? 'ROUTING' : 'REDUNDANCY'}`;
    byId('lab-stage-title').textContent = next.title;
    byId('lab-stage-subtitle').textContent = next.subtitle;
    byId('lab-step-count').textContent = `${next.steps.length} steps`;
    byId('lab-platform').textContent = next.platform;
    const tags = byId('lab-protocol-tags');
    tags.replaceChildren();
    next.tags.forEach((tag) => {
      const item = document.createElement('span');
      item.textContent = tag;
      tags.append(item);
    });
    renderEvidence();
    renderInventory();
    renderStep();
    synchronizePlaybackButton();
    restartTimer();
  }

  labButtons.forEach((button, index) => {
    button.addEventListener('click', () => chooseLab(button.dataset.lab, false, true));
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const destination = event.key === 'Home' ? 0 : event.key === 'End' ? labButtons.length - 1 : stepIndex(index, event.key === 'ArrowRight' ? 1 : -1, labButtons.length);
      chooseLab(labButtons[destination].dataset.lab, true, true);
    });
  });
  byId('lab-play').addEventListener('click', () => setPlaying(!isPlaying));
  byId('lab-prev').addEventListener('click', () => { setPlaying(false); chooseStep(stepIndex(currentStep, -1, currentLab.steps.length)); });
  byId('lab-next').addEventListener('click', () => { setPlaying(false); chooseStep(stepIndex(currentStep, 1, currentLab.steps.length)); });
  byId('lab-share').addEventListener('click', async () => {
    const address = publicLabUrl(window.location.href, currentLab.id, data.getLab);
    if (!address) {
      byId('lab-share-status').textContent = 'Direct links are available after publishing online';
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(address);
      byId('lab-share-status').textContent = 'Link copied';
    } catch (_) {
      window.prompt('Select and copy this direct lab link:', address);
      byId('lab-share-status').textContent = 'Link shown for manual copying';
    }
  });
  reducedMotionQuery.addEventListener?.('change', (event) => { if (event.matches) setPlaying(false); });
  document.addEventListener('visibilitychange', restartTimer);
  document.addEventListener('portfolio:labs-view-change', restartTimer);

  chooseLab(selectedLabId(window.location.href, data.getLab));
})(typeof window !== 'undefined' ? window : globalThis);
