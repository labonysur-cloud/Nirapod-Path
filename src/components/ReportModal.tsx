import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { jsPDF } from 'jspdf';
import {
  X,
  FileText,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Compass,
  Clock,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportModal: React.FC = () => {
  const {
    isReportModalOpen,
    setIsReportModalOpen,
    buildingData,
    startNodeId,
    blockedNodes,
    blockedEdges,
    closedExits,
    routeResult,
    timeElapsed,
    totalSafeExits,
    totalExits,
    reachableSafeExits,
    hazardCoveragePercentage,
    compromisedElementsCount,
    totalElementsCount,
    activityLog,
    language,
    t,
  } = useSimulator();

  const [copied, setCopied] = useState<boolean>(false);

  if (!isReportModalOpen) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedTime = `${pad(Math.floor((timeElapsed % 3600) / 60))}:${pad(timeElapsed % 60)}`;
  const dateStr = new Date().toLocaleString();
  const reportId = `NP-${Date.now().toString(36).toUpperCase()}`;

  // Structured JSON export
  const handleDownloadJson = () => {
    const reportData = {
      reportId,
      appName: 'Nirapod Path (নিরাপদ পথ)',
      generatedAt: new Date().toISOString(),
      building: buildingData.building,
      summary: {
        evacuationStatus: routeResult.status,
        startLocation: startNodeId,
        destinationExit: routeResult.exitId || null,
        totalCost: routeResult.totalCost,
        routeSequence: routeResult.pathNodes,
        routeCorridors: routeResult.pathEdges,
      },
      metrics: {
        simulationDurationFormatted: formattedTime,
        simulationSeconds: timeElapsed,
        totalSafeExits,
        totalExits,
        reachableSafeExits,
        hazardCoveragePercentage,
        compromisedElementsCount,
        totalElementsCount,
      },
      activeHazards: {
        blockedRoomsOrJunctions: Array.from(blockedNodes),
        blockedCorridors: Array.from(blockedEdges),
        closedExits: Array.from(closedExits),
      },
      activityLog: activityLog.map(entry => ({
        time: entry.timeLabel,
        timestamp: new Date(entry.timestamp).toISOString(),
        category: entry.category,
        severity: entry.severity,
        title: entry.title,
        titleBn: entry.titleBn,
        details: entry.details || '',
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nirapod-path-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Professional PDF Export via jsPDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 18;

    // Header Top Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('NIRAPOD PATH - EVACUATION AUDIT REPORT', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`AI DevFest 2026 Incident Simulation Audit | Report ID: ${reportId}`, margin + 6, y + 16);

    y += 28;

    // Metadata Strip
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Building: ${buildingData.building}`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${dateStr}`, pageWidth - margin - 60, y);

    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    // Section 1: Executive KPI Summary Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. EXECUTIVE EVACUATION SUMMARY', margin, y);
    y += 5;

    // Route Status Card in PDF
    const statusBg = routeResult.status === 'success' ? [236, 253, 245] : [254, 242, 242];
    const statusBorder = routeResult.status === 'success' ? [16, 185, 129] : [239, 68, 68];
    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.setDrawColor(statusBorder[0], statusBorder[1], statusBorder[2]);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

    doc.setTextColor(statusBorder[0], statusBorder[1], statusBorder[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const statusLabel =
      routeResult.status === 'success'
        ? `ROUTE VERIFIED: Path found to Exit ${routeResult.exitId} (Total Cost: ${routeResult.totalCost})`
        : routeResult.status === 'no_route'
        ? 'CRITICAL ALERT: No Route Available - Exits Inaccessible'
        : `CRITICAL ALERT: Starting Location ${startNodeId} is Blocked`;
    doc.text(statusLabel, margin + 5, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const routeText =
      routeResult.status === 'success'
        ? `Sequence: ${routeResult.pathNodes.join(' -> ')} | Corridors: ${routeResult.pathEdges.join(', ')}`
        : 'Hazards completely sever transit to safe emergency exits.';
    doc.text(routeText, margin + 5, y + 14);

    y += 26;

    // KPI Metrics Grid
    const colWidth = (pageWidth - margin * 2) / 4;
    const kpis = [
      { label: 'Safe Exits', value: `${totalSafeExits} of ${totalExits}` },
      { label: 'Hazard Coverage', value: `${hazardCoveragePercentage}%` },
      { label: 'Compromised Elements', value: `${compromisedElementsCount} / ${totalElementsCount}` },
      { label: 'Elapsed Time', value: formattedTime },
    ];

    kpis.forEach((kpi, index) => {
      const kpiX = margin + index * colWidth;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(kpiX, y, colWidth - 2, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, kpiX + 3, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.value, kpiX + 3, y + 11);
    });

    y += 20;

    // Section 2: Active Hazard Breakdown
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. ACTIVE HAZARDS & COMPROMISED INFRASTRUCTURE', margin, y);
    y += 5;

    const blockedNodesList = Array.from(blockedNodes).join(', ') || 'None';
    const blockedEdgesList = Array.from(blockedEdges).join(', ') || 'None';
    const closedExitsList = Array.from(closedExits).join(', ') || 'None';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Blocked Rooms / Junctions: ${blockedNodesList}`, margin + 3, y);
    y += 5;
    doc.text(`• Blocked Corridors: ${blockedEdgesList}`, margin + 3, y);
    y += 5;
    doc.text(`• Closed Emergency Exits: ${closedExitsList}`, margin + 3, y);
    y += 9;

    // Section 3: Audit Activity Log
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. SIMULATION ACTIVITY AUDIT LOG', margin, y);
    y += 6;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('TIME', margin + 3, y + 4.5);
    doc.text('CATEGORY', margin + 20, y + 4.5);
    doc.text('EVENT DESCRIPTION & DETAILS', margin + 50, y + 4.5);

    y += 7.5;

    // Table Rows (up to 16 latest entries to fit cleanly)
    doc.setFont('helvetica', 'normal');
    const recentLogs = activityLog.slice(0, 16);

    recentLogs.forEach((item, index) => {
      if (y > 275) return; // stay on page bounds
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
      }

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.timeLabel, margin + 3, y + 4);

      doc.setTextColor(item.severity === 'critical' ? 220 : item.severity === 'warning' ? 202 : 15, item.severity === 'critical' ? 38 : item.severity === 'warning' ? 138 : 23, item.severity === 'critical' ? 38 : item.severity === 'warning' ? 4 : 42);
      doc.setFont('helvetica', 'bold');
      doc.text(item.category.toUpperCase(), margin + 20, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const eventSummary = `${item.title}${item.details ? ' — ' + item.details : ''}`;
      const truncated = eventSummary.length > 75 ? eventSummary.substring(0, 72) + '...' : eventSummary;
      doc.text(truncated, margin + 50, y + 4);

      y += 5.5;
    });

    // Document Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by Nirapod Path (নিরাপদ পথ) · AI DevFest 2026 Solo Challenge Evaluation Platform', margin, 287);

    doc.save(`nirapod-path-audit-report-${Date.now()}.pdf`);
  };

  // Copy Markdown summary
  const handleCopySummary = () => {
    const summary = `
# Nirapod Path — Evacuation Audit Report
- **Report ID**: ${reportId}
- **Building**: ${buildingData.building}
- **Date**: ${dateStr}
- **Duration**: ${formattedTime}
- **Status**: ${routeResult.status}
- **Optimal Route**: ${routeResult.status === 'success' ? routeResult.pathNodes.join(' -> ') : 'None'}
- **Total Cost**: ${routeResult.totalCost}
- **Safe Exits**: ${totalSafeExits} / ${totalExits}
- **Hazard Coverage**: ${hazardCoveragePercentage}%

### Active Hazards
- Blocked Nodes: ${Array.from(blockedNodes).join(', ') || 'None'}
- Blocked Corridors: ${Array.from(blockedEdges).join(', ') || 'None'}
- Closed Exits: ${Array.from(closedExits).join(', ') || 'None'}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.reportModalTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {t.reportModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReportModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Executive Route Result Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              routeResult.status === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                routeResult.status === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
              }`}
            >
              {routeResult.status === 'success' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold">
                  {routeResult.status === 'success'
                    ? `${t.reportOptimalRoute}: ${startNodeId} → ${routeResult.exitId}`
                    : routeResult.status === 'no_route'
                    ? t.reportNoRouteAlert
                    : t.reportStartBlockedAlert}
                </span>
                {routeResult.status === 'success' && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                    {t.totalCost}: {routeResult.totalCost}
                  </span>
                )}
              </div>

              {routeResult.status === 'success' && (
                <p className="text-xs font-mono mt-1 opacity-90">
                  {routeResult.pathNodes.join(' ─ ')} ({routeResult.pathEdges.length} {t.corridorsTraversed.toLowerCase()})
                </p>
              )}
            </div>
          </div>

          {/* 4 KPI Grid Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
              {t.reportKpiSummary}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">{t.totalSafeExits}</span>
                <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {totalSafeExits} / {totalExits}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">{t.hazardCoverage}</span>
                <div className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {hazardCoveragePercentage}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">{t.compromisedElements}</span>
                <div className="text-lg font-mono font-bold text-red-600 dark:text-red-400 mt-1">
                  {compromisedElementsCount} / {totalElementsCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">{t.timeElapsed}</span>
                <div className="text-lg font-mono font-bold text-slate-800 dark:text-neutral-200 mt-1">
                  {formattedTime}
                </div>
              </div>
            </div>
          </div>

          {/* Active Hazards Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
              {t.reportActiveHazards}
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-neutral-400">• {t.blockedNodesCount}:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">
                  {Array.from(blockedNodes).join(', ') || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-neutral-400">• {t.blockedEdgesCount}:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">
                  {Array.from(blockedEdges).join(', ') || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-neutral-400">• {t.closedExitsCount}:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">
                  {Array.from(closedExits).join(', ') || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Activity Stream Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {t.reportAuditLog} ({activityLog.length})
              </h3>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                {t.showingLatestEvents}
              </span>
            </div>

            <div className="max-h-44 overflow-y-auto divide-y divide-slate-200/60 dark:divide-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50/50 dark:bg-neutral-950 p-2">
              {activityLog.slice(0, 10).map(entry => (
                <div key={entry.id} className="py-1.5 px-2 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-slate-400 dark:text-neutral-500">
                      {entry.timeLabel}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                      {language === 'bn' ? entry.titleBn : entry.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-neutral-500 shrink-0">
                    {entry.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-neutral-950/50">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.reportCopied : t.copyReport}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* JSON Download */}
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-500" />
              <span>{t.downloadJson}</span>
            </button>

            {/* Formatted PDF Download */}
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadPdf}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
