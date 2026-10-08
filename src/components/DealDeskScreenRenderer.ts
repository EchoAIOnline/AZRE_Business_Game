import * as THREE from 'three';
import { DepartmentId } from '../types/office';

/**
 * Creates dynamic high-resolution CanvasTextures for 3D computer monitors
 * representing the actual DealDesk Ultra interface at https://dealdesk.asharizakargroup.com
 */
export function createDealDeskScreenTexture(department: DepartmentId): {
  texture: THREE.CanvasTexture;
  update: (time: number) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  let lastFrameTime = 0;

  const renderScreen = (time: number) => {
    // Background: High-tech dark corporate interface with crisp bright panels
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top Header Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 70);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, 70);

    // Gold AZ Monogram circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(42, 35, 20, 0, Math.PI * 2);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Monogram text
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AZ', 42, 36);
    ctx.restore();

    // Brand Name: ASHARI ZAKAR REAL ESTATE
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ASHARI', 74, 34);

    ctx.fillStyle = '#00ff66';
    ctx.fillText('ZAKAR', 152, 34);

    ctx.font = '500 11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('REAL ESTATE  |  DEALDESK ULTRA', 222, 33);

    // Live URL Badge
    ctx.fillStyle = '#022c22';
    ctx.fillRect(560, 16, 290, 36);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(560, 16, 290, 36);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText('dealdesk.asharizakargroup.com', 575, 38);

    // Department Tag (Right side)
    const deptBadgeText =
      department === 'acquisitions'
        ? 'ACQUISITIONS DESK'
        : department === 'dispositions'
        ? 'DISPOSITIONS DESK'
        : department === 'operations'
        ? 'OPERATIONS & CLOSING'
        : department === 'ceo'
        ? 'CEO / APPROVALS'
        : 'DEAL REVIEW BOARD';

    const deptColor =
      department === 'acquisitions'
        ? '#10b981'
        : department === 'dispositions'
        ? '#f59e0b'
        : department === 'operations'
        ? '#38bdf8'
        : department === 'ceo'
        ? '#eab308'
        : '#a855f7';

    ctx.fillStyle = deptColor;
    ctx.fillRect(865, 18, 142, 32);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#090d16';
    ctx.textAlign = 'center';
    ctx.fillText(deptBadgeText, 936, 38);
    ctx.textAlign = 'left';

    // Content Panels layout
    if (department === 'acquisitions') {
      renderAcquisitionsModule(ctx, time);
    } else if (department === 'dispositions') {
      renderDispositionsModule(ctx, time);
    } else if (department === 'operations') {
      renderOperationsModule(ctx, time);
    } else if (department === 'ceo') {
      renderCeoModule(ctx, time);
    } else {
      renderDealReviewModule(ctx, time);
    }

    // Bottom Ticker / Status Bar
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(0, canvas.height - 40, canvas.width, 40);

    const tickerOffset = (time * 60) % 1200;
    ctx.save();
    ctx.rect(10, canvas.height - 40, canvas.width - 20, 40);
    ctx.clip();
    ctx.font = '12px monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText(
      `● SURECASH OFFER ENGINE: 7-DAY DUE DILIGENCE · 1% EMD · WEISSMAN PC PREFERRED  |  METRO ATLANTA: BROOKHAVEN ($1.85M ARV) · BUCKHEAD ($2.45M ARV) · SANDY SPRINGS ($780K ARV) · DUNWOODY ($1.65M ARV)  |  DATABASE: SECURE READ-ONLY SYNC`,
      10 - tickerOffset + 1200,
      canvas.height - 15
    );
    ctx.fillText(
      `● SURECASH OFFER ENGINE: 7-DAY DUE DILIGENCE · 1% EMD · WEISSMAN PC PREFERRED  |  METRO ATLANTA: BROOKHAVEN ($1.85M ARV) · BUCKHEAD ($2.45M ARV) · SANDY SPRINGS ($780K ARV) · DUNWOODY ($1.65M ARV)  |  DATABASE: SECURE READ-ONLY SYNC`,
      10 - tickerOffset,
      canvas.height - 15
    );
    ctx.restore();

    texture.needsUpdate = true;
  };

  const update = (time: number) => {
    // Throttle canvas texture updates for 60fps rendering efficiency
    if (time - lastFrameTime > 0.08) {
      lastFrameTime = time;
      renderScreen(time);
    }
  };

  renderScreen(0);
  return { texture, update };
}

function renderAcquisitionsModule(ctx: CanvasRenderingContext2D, time: number) {
  // Panel 1: Sourcing & MLS Intake (Left)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 85, 470, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(20, 85, 470, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('MLS INTAKE & REDEVELOPMENT SOURCING', 35, 112);

  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Keywords: "tear-down", "sold as-is", "needs renovation", "redevelopment"', 35, 130);

  // Rows of listings
  const listings = [
    { addr: '1420 Ashford Dunwoody (Brookhaven)', ask: '$685K', target: '$450K', tag: 'TEARDOWN' },
    { addr: '4822 Powers Ferry (Buckhead)', ask: '$890K', target: '$620K', tag: '0.85 AC' },
    { addr: '715 Abernathy Rd (Sandy Springs)', ask: '$440K', target: '$310K', tag: 'GUT REHAB' },
    { addr: '2350 Mount Vernon (Dunwoody)', ask: '$520K', target: '$380K', tag: 'LOT SPEC' },
  ];

  listings.forEach((item, idx) => {
    const y = 160 + idx * 38;
    ctx.fillStyle = idx === 0 ? '#1e293b' : '#141e33';
    ctx.fillRect(35, y - 18, 440, 32);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.fillText(item.addr, 45, y);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Ask: ${item.ask}`, 285, y);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`Target: ${item.target}`, 370, y);
  });

  // Panel 2: Live Underwriting / ARV Formula (Right)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(510, 85, 490, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(510, 85, 490, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.fillText('SURECASH ARV UNDERWRITING CALCULATOR', 525, 112);

  // Underwriting breakdown
  const metrics = [
    { label: 'Projected Resale ARV (1.0 mi Comps)', val: '$1,850,000', col: '#ffffff' },
    { label: 'Builder Construction & Demo Budget', val: '- $875,000', col: '#ef4444' },
    { label: 'Builder Target Profit Margin (20%)', val: '- $370,000', col: '#f59e0b' },
    { label: 'AZRE Net Spread Target', val: '- $35,000', col: '#10b981' },
    { label: 'MAX ALLOWABLE SURECASH OFFER (24.3%)', val: '$450,000', col: '#34d399', bold: true },
  ];

  metrics.forEach((m, idx) => {
    const y = 145 + idx * 34;
    ctx.font = m.bold ? 'bold 13px sans-serif' : '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(m.label, 525, y);

    ctx.font = m.bold ? 'bold 14px monospace' : '13px monospace';
    ctx.fillStyle = m.col;
    ctx.textAlign = 'right';
    ctx.fillText(m.val, 980, y);
    ctx.textAlign = 'left';
  });

  // Panel 3: Live Market Comps Chart (Bottom Half)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 340, 980, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(20, 340, 980, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('METRO ATLANTA RE-DEVELOPMENT SPREAD BENCHMARKS', 35, 368);

  // Draw animated chart bars
  const bars = [
    { label: 'Brookhaven Teardowns', spread: 82, val: '$38,000' },
    { label: 'Buckhead Luxury Lots', spread: 94, val: '$52,000' },
    { label: 'Sandy Springs Rehabs', spread: 68, val: '$31,000' },
    { label: 'Dunwoody Spec Builds', spread: 76, val: '$35,000' },
  ];

  bars.forEach((b, idx) => {
    const x = 50 + idx * 235;
    const barHeight = b.spread * 1.3 + Math.sin(time * 2 + idx) * 6;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, 400, 180, 130);

    // Gradient bar
    const barGrad = ctx.createLinearGradient(x, 530 - barHeight, x, 530);
    barGrad.addColorStop(0, '#00ff66');
    barGrad.addColorStop(1, '#059669');
    ctx.fillStyle = barGrad;
    ctx.fillRect(x + 15, 530 - barHeight, 150, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.val, x + 90, 520 - barHeight);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(b.label, x + 90, 550);
    ctx.textAlign = 'left';
  });
}

function renderDispositionsModule(ctx: CanvasRenderingContext2D, time: number) {
  // Panel 1: The Network Builder Match (Left)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 85, 580, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(20, 85, 580, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('THE NETWORK · VETTED BUILDER & BUYER MATCHES', 35, 112);

  const buyers = [
    { name: 'Pinnacle Custom Homes LLC', focus: 'Brookhaven / 30319', cap: '$2.5M POF', status: 'MATCHED ($510K)' },
    { name: 'Atlanta Landmark Estates', focus: 'Buckhead / 30327', cap: '$4.0M Line', status: 'CONTRACT SENT' },
    { name: 'Northside Rehab Partners', focus: 'Sandy Springs', cap: '$1.2M Cash', status: 'UNDER REVIEW' },
    { name: 'Apex Residential Builders', focus: 'Dunwoody / Roswell', cap: '$1.8M POF', status: 'CLOSED (SPREAD $30K)' },
  ];

  buyers.forEach((b, idx) => {
    const y = 160 + idx * 38;
    ctx.fillStyle = idx === 0 ? '#1e293b' : '#141e33';
    ctx.fillRect(35, y - 18, 550, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(b.name, 45, y);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(b.focus, 240, y);

    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(b.status, 570, y);
    ctx.textAlign = 'left';
  });

  // Panel 2: Double-Closing Spread Tracker (Right)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(620, 85, 380, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(620, 85, 380, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.fillText('GROSS SPREAD SINK & REALIZATION', 635, 112);

  const stats = [
    { label: 'A-to-B Contract Price', val: '$475,000' },
    { label: 'B-to-C Resale Price', val: '$510,000' },
    { label: 'Gross Spread Spread', val: '+$35,000' },
    { label: 'Est. Attorney & Transaction Cost', val: '-$4,500' },
    { label: 'NET TRANSACTION PROFIT', val: '+$30,500' },
  ];

  stats.forEach((s, idx) => {
    const y = 145 + idx * 34;
    ctx.fillStyle = '#94a3b8';
    ctx.font = idx === 4 ? 'bold 12px sans-serif' : '11px sans-serif';
    ctx.fillText(s.label, 635, y);

    ctx.fillStyle = idx >= 2 ? '#34d399' : '#ffffff';
    ctx.font = idx === 4 ? 'bold 14px monospace' : '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(s.val, 980, y);
    ctx.textAlign = 'left';
  });

  // Panel 3: Monthly Realized Returns (Bottom)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 340, 980, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(20, 340, 980, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('MONTHLY HISTORICAL AZRE TRANSACTION SPREADS', 35, 368);

  // Wave / trendline
  ctx.beginPath();
  ctx.moveTo(50, 520);
  for (let i = 0; i <= 20; i++) {
    const x = 50 + i * 45;
    const y = 470 - Math.sin((i / 3) + time) * 35 - i * 3.5;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('YTD Gross Realized: $318,500', 680, 370);
}

function renderOperationsModule(ctx: CanvasRenderingContext2D, time: number) {
  // Panel 1: Weissman PC Escrow & Closing (Left)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 85, 480, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(20, 85, 480, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('CLOSING ATTORNEY & ESCROW (WEISSMAN PC)', 35, 112);

  const opsRows = [
    { label: 'Closing Counsel', val: 'Weissman PC (Buckhead/Atlanta)' },
    { label: '1% Earnest Money Deposit', val: '$4,750 Escrowed' },
    { label: 'Title Search & Municipal Lien', val: 'Clear / Completed' },
    { label: 'Simultaneous A-B / B-C Close', val: 'Scheduled: Oct 24, 2026' },
  ];

  opsRows.forEach((r, idx) => {
    const y = 150 + idx * 36;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(r.label, 35, y);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(r.val, 480, y);
    ctx.textAlign = 'left';
  });

  // Panel 2: Due Diligence 7-Day Inspection Clock (Right)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(520, 85, 480, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(520, 85, 480, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#f43f5e';
  ctx.fillText('7-DAY DUE DILIGENCE COUNTDOWN & MILESTONES', 535, 112);

  // Inspection progress bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(535, 140, 450, 24);
  const pulse = (Math.sin(time * 3) + 1) * 0.5;
  ctx.fillStyle = pulse > 0.5 ? '#10b981' : '#059669';
  ctx.fillRect(535, 140, 280, 24);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('DAY 4 OF 7 · CONTRACTOR WALKTHROUGH CONFIRMED', 545, 157);

  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('✓ Environmental & Topo: Completed', 535, 195);
  ctx.fillText('✓ Demolition & Utility Disconnect Estimate: $14,500', 535, 220);
  ctx.fillText('✓ Weissman PC Settlement Statements drafted', 535, 245);

  // Panel 3: Capital & Transactional Facility (Bottom)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 340, 980, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(20, 340, 980, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('TRANSACTIONAL FUNDING & PRIVATE CAPITAL DEPLOYMENT', 35, 368);

  const funding = [
    { label: 'Pre-Approved Facility', val: '$1,000,000' },
    { label: 'Private Lender Rates (Prorated)', val: '12% Annualized (7-30d)' },
    { label: 'Active Deployment in Double Close', val: '$475,000' },
    { label: 'Available Capital Balance', val: '$525,000' },
  ];

  funding.forEach((f, idx) => {
    const x = 50 + idx * 235;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, 400, 215, 110);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, 400, 215, 110);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(f.label, x + 12, 430);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(f.val, x + 12, 470);
  });
}

function renderCeoModule(ctx: CanvasRenderingContext2D, time: number) {
  // Panel 1: Executive Approvals (Left)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 85, 480, 240);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 85, 480, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('EXECUTIVE DEAL APPROVALS & CAPITAL AUTHORIZATION', 35, 112);

  const approvals = [
    { deal: '1420 Ashford Dunwoody', spread: '+$40,000', status: 'APPROVED · WEISSMAN PC' },
    { deal: '4822 Powers Ferry Rd', spread: '+$55,000', status: 'AUTHORIZED · DOUBLE CLOSE' },
    { deal: '715 Abernathy Rd NE', spread: '+$30,000', status: 'UNDER REVIEW' },
  ];

  approvals.forEach((a, idx) => {
    const y = 160 + idx * 44;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(35, y - 20, 450, 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(a.deal, 45, y);

    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(a.spread, 240, y);

    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(a.status, 475, y);
    ctx.textAlign = 'left';
  });

  // Panel 2: Portfolio Yield & Target Margins (Right)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(520, 85, 480, 240);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(520, 85, 480, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AZRE PORTFOLIO LIQUIDITY & PERFORMANCE', 535, 112);

  const metrics = [
    { label: 'YTD Realized Gross Spreads', val: '$318,500' },
    { label: 'Active Transaction Facility ($1M Cap)', val: '$475,000 Drawn' },
    { label: 'Average Realized Spread / Deal', val: '$38,200 (Target > $20k)' },
    { label: 'Capital Partner Yield (Prorated 12%)', val: 'Compliant & Timely' },
  ];

  metrics.forEach((m, idx) => {
    const y = 150 + idx * 36;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(m.label, 535, y);

    ctx.fillStyle = idx === 0 ? '#00ff66' : '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(m.val, 980, y);
    ctx.textAlign = 'left';
  });

  // Bottom Visual: Scaling Run Rate
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 340, 980, 240);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(20, 340, 980, 240);

  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ROADMAP TO $1B+ ENTERPRISE SCALING PIPELINE', 35, 368);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '11px sans-serif';
  ctx.fillText('Centralized Operations via DealDesk Ultra · Systematized Dispo Network', 35, 390);

  // Milestone pillars
  ['1. Sourcing Scale (100% MLS)', '2. Repeat Builder Network', '3. Capital Facilities ($10M+)', '4. Multi-Market Expansion'].forEach((p, idx) => {
    const x = 50 + idx * 235;
    ctx.fillStyle = idx <= 1 ? '#064e3b' : '#1e293b';
    ctx.fillRect(x, 420, 215, 90);
    ctx.strokeStyle = idx <= 1 ? '#059669' : '#475569';
    ctx.strokeRect(x, 420, 215, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(p, x + 15, 455);

    ctx.fillStyle = idx <= 1 ? '#34d399' : '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(idx <= 1 ? '● ACTIVE PHASE' : '○ PROJECTED', x + 15, 485);
  });
}

function renderDealReviewModule(ctx: CanvasRenderingContext2D, time: number) {
  // Conference presentation board
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 85, 980, 495);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 85, 980, 495);

  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText('INVESTMENT COMMITTEE · DEAL REVIEW PRESENTATION', 40, 120);

  // Active property being presented
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(40, 145, 940, 110);
  ctx.strokeStyle = '#4338ca';
  ctx.strokeRect(40, 145, 940, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('SUBJECT ASSET: 1420 Ashford Dunwoody Rd, Brookhaven, GA 30319', 55, 178);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('1961 Ranch · 0.62 Acre Corner Parcel · Asking: $685K · Contract Price: $475K · ARV: $1.85M', 55, 205);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('BUYER MATCH: Pinnacle Custom Homes ($510K Resale) · GROSS SPREAD: +$35,000', 55, 235);

  // Committee Review Checklist
  const checks = [
    { title: 'Due Diligence Walkthrough', status: 'PASSED (Contractor estimate $14.5k demo)' },
    { title: 'Title & Municipal Lien Check', status: 'PASSED (Clear title at Weissman PC)' },
    { title: 'Builder Proof of Funds', status: 'VERIFIED ($3.5M Line of Credit active)' },
    { title: 'Transactional Funding Ready', status: 'CONFIRMED ($475k draw on Oct 24, 2026)' },
  ];

  checks.forEach((c, idx) => {
    const x = 40 + (idx % 2) * 480;
    const y = 280 + Math.floor(idx / 2) * 90;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, 460, 75);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(x, y, 460, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(c.title, x + 15, y + 30);

    ctx.fillStyle = '#10b981';
    ctx.font = '11px monospace';
    ctx.fillText(`✓ ${c.status}`, x + 15, y + 55);
  });

  // Footer
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('DEAL COMMITTEE STATUS: 100% UNANIMOUS APPROVAL TO PROCEED WITH DOUBLE CLOSING', 40, 555);
}

