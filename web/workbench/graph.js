const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}) { const el = document.createElementNS(NS, tag); for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, String(v)); return el; }
function seed(id) {let h=2166136261; for(const c of id) h=Math.imul(h^c.charCodeAt(0),16777619); return (h>>>0)/4294967296;}

/** Stable, edge-driven layout. Compute once from the union of captured versions. */
export function layoutGraph(versions) {
  const nodes = new Map(), edges = new Map();
  for(const version of versions) {
    for(const n of version.content.nodes) nodes.set(n.id,n);
    for(const e of version.content.edges) edges.set(e.id,e);
  }
  const points = [...nodes.values()].map(n=>({id:n.id,x:100+seed(n.id)*800,y:80+seed(n.id+'y')*370}));
  const byId=new Map(points.map(n=>[n.id,n]));
  for(let step=0;step<280;step++) {
    const force=new Map(points.map(n=>[n.id,{x:(500-n.x)*.007,y:(250-n.y)*.007}]));
    for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++) {
      const a=points[i],b=points[j]; let dx=a.x-b.x,dy=a.y-b.y; const d=Math.max(1,Math.hypot(dx,dy));
      const f=Math.min(8,2200/(d*d)); dx=dx/d*f;dy=dy/d*f;
      force.get(a.id).x+=dx;force.get(a.id).y+=dy;force.get(b.id).x-=dx;force.get(b.id).y-=dy;
    }
    for(const e of edges.values()) {const a=byId.get(e.source),b=byId.get(e.target); if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),f=(d-125)*.015;force.get(a.id).x+=dx/d*f;force.get(a.id).y+=dy/d*f;force.get(b.id).x-=dx/d*f;force.get(b.id).y-=dy/d*f;}
    for(const n of points) {const f=force.get(n.id); n.x=Math.max(100,Math.min(865,n.x+f.x));n.y=Math.max(50,Math.min(450,n.y+f.y));}
  }
  return byId;
}

export function drawGraph(host, graph, positions, inherited, selected, onSelect) {
  host.replaceChildren();
  for(const edge of graph.edges) {const a=positions.get(edge.source),b=positions.get(edge.target);if(!a||!b)continue;const line=svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'graph-edge'});const title=svg('title');title.textContent=edge.label;line.append(title);host.append(line);}
  for(const node of graph.nodes) {
    const p=positions.get(node.id);if(!p)continue;
    const g=svg('g',{transform:`translate(${p.x} ${p.y})`,class:`graph-node ${inherited.has(node.id)?'':'new'} ${selected===node.id?'selected':''}`,tabindex:0,role:'button','aria-label':node.label,'aria-pressed':selected===node.id});
    g.append(svg('circle',{r:selected===node.id?8:6}));
    const label=svg('text',{x:12,y:4});label.textContent=node.label.length>32?node.label.slice(0,30)+'…':node.label;g.append(label);
    const title=svg('title');title.textContent=node.label;g.append(title);
    g.addEventListener('click',()=>onSelect(node.id));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(node.id);}});host.append(g);
  }
}
