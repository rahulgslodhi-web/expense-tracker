/**
 * Interactive SVG Chart Renderer
 * Lightweight, zero-dependency, ultra-crisp vector charts for mobile screens
 */

class ChartRenderer {
  /**
   * Renders the Income Utilisation Donut Chart
   * Displays monthly income bifurcation:
   * - Expenses % and ₹
   * - Investments % and ₹
   * - Remaining Savings % and ₹
   */
  static renderDonut(containerId, income, expenses, invested) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const remaining = Math.max(0, income - expenses - invested);
    const total = income > 0 ? income : 1;

    let expPct = Math.round((expenses / total) * 100);
    let invPct = Math.round((invested / total) * 100);
    let savPct = Math.max(0, 100 - expPct - invPct);

    // If expenses + investments exceed income
    const isDeficit = (expenses + invested) > income;
    if (isDeficit) {
      const combined = (expenses + invested) || 1;
      expPct = Math.round((expenses / combined) * 100);
      invPct = Math.max(0, 100 - expPct);
      savPct = 0;
    }

    // Donut SVG parameters
    const size = 150;
    const strokeWidth = 19;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const segments = [
      { name: 'Expenses', pct: expPct, color: '#d46b43', amount: expenses },
      { name: 'Investments', pct: invPct, color: '#234d3d', amount: invested },
      { name: 'Remaining', pct: savPct, color: '#d29d4c', amount: remaining }
    ];

    let accumulatedOffset = 0;
    const strokeDashArrays = segments.map(seg => {
      const arcLength = (seg.pct / 100) * circumference;
      const offset = accumulatedOffset;
      accumulatedOffset += arcLength;
      return {
        ...seg,
        arcLength,
        dashArray: `${arcLength} ${circumference - arcLength}`,
        dashOffset: -offset
      };
    });

    const svgHTML = `
      <div class="donut-chart-wrapper">
        <div class="donut-svg-container">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-svg">
            <circle
              cx="${size/2}"
              cy="${size/2}"
              r="${radius}"
              fill="none"
              stroke="#f0ece4"
              stroke-width="${strokeWidth}"
            />
            ${strokeDashArrays.map(seg => `
              <circle
                cx="${size/2}"
                cy="${size/2}"
                r="${radius}"
                fill="none"
                stroke="${seg.color}"
                stroke-width="${strokeWidth}"
                stroke-dasharray="${seg.dashArray}"
                stroke-dashoffset="${seg.dashOffset}"
                stroke-linecap="butt"
                class="donut-segment"
                transform="rotate(-90 ${size/2} ${size/2})"
              />
            `).join('')}
          </svg>
          <div class="donut-center-info">
            <span class="donut-total">₹${income.toLocaleString('en-IN')}</span>
            <span class="donut-label">Total Income</span>
          </div>
        </div>
        <div class="donut-legend">
          ${segments.map(s => `
            <div class="legend-item" title="₹${s.amount.toLocaleString('en-IN')}">
              <span class="legend-bullet" style="background-color: ${s.color};"></span>
              <div class="legend-text">
                <span class="legend-title">${s.name} (${s.pct}%)</span>
                <span class="legend-pct">₹${s.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ${isDeficit ? `
        <div style="font-size:0.75rem; color:#b91c1c; background:#fee2e2; padding:6px 10px; border-radius:8px; margin-top:8px; text-align:center; font-weight:600;">
          ⚠️ Monthly outflows exceed income by ₹${(expenses + invested - income).toLocaleString('en-IN')}
        </div>
      ` : ''}
    `;

    container.innerHTML = svgHTML;
  }

  /**
   * Renders the Investment Asset Allocation Donut Chart
   * Displays bifurcation:
   * - Mutual Funds (Green)
   * - Equities (Blue)
   * - Others / Emergency Buffer / Gold / FD (Amber)
   */
  static renderAssetDonut(containerId, assetClasses, totalPortfolio) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = totalPortfolio > 0 ? totalPortfolio : 1;

    // Donut SVG parameters
    const size = 140;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedOffset = 0;
    const strokeDashArrays = assetClasses.map(ac => {
      const pct = totalPortfolio > 0 ? Math.round((ac.amount / total) * 100) : 0;
      const arcLength = (pct / 100) * circumference;
      const offset = accumulatedOffset;
      accumulatedOffset += arcLength;
      return {
        ...ac,
        pct,
        arcLength,
        dashArray: `${arcLength} ${circumference - arcLength}`,
        dashOffset: -offset
      };
    });

    const svgHTML = `
      <div class="donut-chart-wrapper" style="padding: 4px 0;">
        <div class="donut-svg-container" style="width:${size}px; height:${size}px;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-svg">
            <circle
              cx="${size/2}"
              cy="${size/2}"
              r="${radius}"
              fill="none"
              stroke="#f0ece4"
              stroke-width="${strokeWidth}"
            />
            ${strokeDashArrays.map(seg => `
              <circle
                cx="${size/2}"
                cy="${size/2}"
                r="${radius}"
                fill="none"
                stroke="${seg.color}"
                stroke-width="${strokeWidth}"
                stroke-dasharray="${seg.dashArray}"
                stroke-dashoffset="${seg.dashOffset}"
                stroke-linecap="butt"
                class="donut-segment"
                transform="rotate(-90 ${size/2} ${size/2})"
              />
            `).join('')}
          </svg>
          <div class="donut-center-info">
            <span class="donut-total" style="font-size:0.95rem;">₹${totalPortfolio.toLocaleString('en-IN')}</span>
            <span class="donut-label" style="font-size:0.68rem;">Portfolio</span>
          </div>
        </div>
        <div class="donut-legend">
          ${assetClasses.map(ac => `
            <div class="legend-item" onclick="app.setInvestmentFilter('${ac.id}')" style="cursor:pointer;" title="Click to filter">
              <span class="legend-bullet" style="background-color: ${ac.color};"></span>
              <div class="legend-text">
                <span class="legend-title">${ac.name.split(' ')[0]} (${ac.percent}%)</span>
                <span class="legend-pct">₹${ac.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = svgHTML;
  }

  /**
   * Renders the mini portfolio trend sparkline in Investments screen
   */
  static renderSparkline(containerId, values, color = '#234d3d') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = 120;
    const height = 48;
    const padding = 4;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;

    // Convert values to SVG points
    const points = values.map((val, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return { x, y };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const fillPathD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="sparkline-svg">
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.28" />
            <stop offset="100%" stop-color="${color}" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        <path d="${fillPathD}" fill="url(#sparklineGrad)" />
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="${points[points.length-1].x}" cy="${points[points.length-1].y}" r="3.5" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
      </svg>
    `;

    container.innerHTML = svg;
  }
}

window.ChartRenderer = ChartRenderer;
