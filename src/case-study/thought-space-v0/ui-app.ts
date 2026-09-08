import type { RetrievalRecord, ThoughtNode, ThoughtSpaceViewerPayload } from "./types.js";

const SVG_NS = "http://www.w3.org/2000/svg";
let payload: ThoughtSpaceViewerPayload;
let selectedNodeId: string | null = null;

function element<T extends Element>(id: string): T {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`Missing #${id}`);
  return found as unknown as T;
}

function htmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function currentRetrieval(): RetrievalRecord | undefined {
  const mode = element<HTMLSelectElement>("retrievalMode").value;
  return payload.retrievals.find((item) => item.mode === mode);
}

function clusterClass(node: ThoughtNode): string {
  const normalized = node.clusterHint?.toLowerCase() ?? "";
  return normalized === "cooling" || normalized === "outcomes" || normalized === "constraints" ? normalized : "other";
}

function renderGraph(): void {
  const svg = element<SVGSVGElement>("graph");
  svg.replaceChildren();
  const snapshot = payload.snapshot;
  if (snapshot === null || snapshot.nodes.length === 0) return;
  const retrieval = currentRetrieval();
  const centerX = 450;
  const centerY = 280;
  const radius = Math.min(205, 90 + snapshot.nodes.length * 22);
  const positions = new Map<string, { x: number; y: number }>();
  snapshot.nodes.forEach((node, index) => {
    const angle = -Math.PI / 2 + index * ((Math.PI * 2) / snapshot.nodes.length);
    positions.set(node.id, { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
  });
  for (const edge of snapshot.edges) {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (source === undefined || target === undefined) continue;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(source.x)); line.setAttribute("y1", String(source.y));
    line.setAttribute("x2", String(target.x)); line.setAttribute("y2", String(target.y));
    const traversed = retrieval?.traversedEdgeIds.includes(edge.id) ?? false;
    const knocked = retrieval?.mode === "knockout" && retrieval.interventionEdgeId === edge.id;
    line.setAttribute("class", `edge ${knocked ? "knocked" : traversed ? "traversed" : ""}`);
    svg.append(line);
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", String((source.x + target.x) / 2)); label.setAttribute("y", String((source.y + target.y) / 2 - 7));
    label.setAttribute("class", "edge-label"); label.textContent = edge.relationLabel;
    svg.append(label);
  }
  for (const node of snapshot.nodes) {
    const position = positions.get(node.id);
    if (position === undefined) continue;
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", `node ${clusterClass(node)} ${selectedNodeId === node.id ? "selected" : ""}`);
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", String(position.x)); circle.setAttribute("cy", String(position.y)); circle.setAttribute("r", "62");
    circle.addEventListener("click", () => { selectedNodeId = node.id; renderGraph(); renderNodeDetail(node); });
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", String(position.x)); text.setAttribute("y", String(position.y + 4));
    const words = node.label.split(" ");
    const first = document.createElementNS(SVG_NS, "tspan");
    first.setAttribute("x", String(position.x)); first.setAttribute("dy", words.length > 2 ? "-7" : "0"); first.textContent = words.slice(0, 2).join(" ");
    text.append(first);
    if (words.length > 2) { const second = document.createElementNS(SVG_NS, "tspan"); second.setAttribute("x", String(position.x)); second.setAttribute("dy", "16"); second.textContent = words.slice(2).join(" "); text.append(second); }
    group.append(circle, text); svg.append(group);
  }
}

function renderNodeDetail(node: ThoughtNode): void {
  element("nodeDetail").innerHTML = `<strong>${htmlEscape(node.label)}</strong> · ${htmlEscape(node.kind)} · persistence ${node.persistence.toFixed(2)}<br>${htmlEscape(node.summary)}<br><code>${htmlEscape(node.provenance.join(", "))}</code>`;
}

function render(): void {
  element("claimBoundary").textContent = payload.manifest.claimBoundary;
  element("runBadge").textContent = `${payload.manifest.runId} · ${payload.manifest.status}`;
  const metrics = [
    [String(payload.snapshot?.nodes.length ?? 0), "bubbles"],
    [String(payload.snapshot?.edges.length ?? 0), "relations"],
    [String(payload.delta?.primitiveGenerated.length ?? 0), "primitive updates"],
    [String(payload.retrievals.length), "retrieval states"],
    [payload.leakageAudit.status.replaceAll("_", " "), "leakage audit"],
  ];
  element("metrics").innerHTML = metrics.map(([value, label]) => `<div class="metric"><strong>${htmlEscape(value ?? "")}</strong><span>${htmlEscape(label ?? "")}</span></div>`).join("");
  element("encounter").textContent = payload.encounter;
  element("researchNote").textContent = payload.researchNote;
  element("response").textContent = payload.response || "No probe response was produced.";
  const links = [["Encounter trace", payload.traceUrls.encounter], ["Probe trace", payload.traceUrls.probe]].filter((item): item is [string, string] => item[1] !== null);
  element("traceLinks").innerHTML = links.length === 0 ? "Synthetic fixture: no live traces." : links.map(([label, url]) => `<a href="${htmlEscape(url)}" target="_blank" rel="noreferrer">${htmlEscape(label)}</a>`).join("");
  const select = element<HTMLSelectElement>("retrievalMode");
  select.innerHTML = payload.retrievals.map((item) => `<option value="${item.mode}">${item.mode}</option>`).join("");
  select.addEventListener("change", () => { renderGraph(); renderRetrieval(); });
  element("stateDelta").innerHTML = [
    ...(payload.delta?.agentAuthored ?? []).map((item) => `<div class="event agent">Agent · <code>${htmlEscape(JSON.stringify(item))}</code></div>`),
    ...(payload.delta?.primitiveGenerated ?? []).map((item) => `<div class="event primitive">Primitive · <code>${htmlEscape(JSON.stringify(item))}</code></div>`),
    ...payload.validation.rejectedOperations.map((item) => `<div class="event">Rejected · ${htmlEscape(item.reason)}</div>`),
  ].join("") || "No accepted state transition.";
  const auditClass = payload.leakageAudit.status === "no_leakage_observed" ? "status-ok" : "status-warn";
  element("leakage").innerHTML = `<p class="${auditClass}">${htmlEscape(payload.leakageAudit.status)}</p><p>${htmlEscape(payload.leakageAudit.claimBoundary)}</p>${[...payload.leakageAudit.runtimeChecks, ...payload.leakageAudit.boundaryFindings].map((item) => `<div class="event">${htmlEscape(item)}</div>`).join("") || "No audit finding."}`;
  renderGraph(); renderRetrieval();
}

function renderRetrieval(): void {
  const retrieval = currentRetrieval();
  element("retrievalDetail").innerHTML = retrieval === undefined ? "No retrieval was produced." : `<p><strong>${retrieval.mode}</strong></p><p>Seed: <code>${htmlEscape(retrieval.forcedSeedNodeId)}</code></p><p>Path: <code>${htmlEscape(retrieval.traversedEdgeIds.join(" → ") || "no edge traversed")}</code></p><p>Selected: ${retrieval.selectedNodeIds.length}</p><p>Context hash: <code>${retrieval.finalContextHash.slice(0, 16)}</code></p>`;
}

const response = await fetch("/api/thought-space", { cache: "no-store" });
if (!response.ok) throw new Error(`Viewer API failed: ${response.status}`);
payload = await response.json() as ThoughtSpaceViewerPayload;
render();
