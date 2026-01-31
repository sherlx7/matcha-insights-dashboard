import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ClientProfitability, ClientOrder, MatchaProduct } from '@/types/database';

interface ExportData {
  clients: ClientProfitability[];
  orders: ClientOrder[];
  products: MatchaProduct[];
  forecast?: { month: string; revenue: number; cogs: number; profit: number }[];
  analysis?: string;
}

// CSV Export
export function exportToCSV(data: ExportData, reportType: 'profitability' | 'orders' | 'forecast') {
  let csvContent = '';
  let filename = '';

  switch (reportType) {
    case 'profitability':
      csvContent = generateProfitabilityCSV(data.clients);
      filename = `client-profitability-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case 'orders':
      csvContent = generateOrdersCSV(data.orders, data.clients, data.products);
      filename = `sales-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case 'forecast':
      csvContent = generateForecastCSV(data.forecast || []);
      filename = `financial-forecast-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
  }

  downloadFile(csvContent, filename, 'text/csv');
}

function generateProfitabilityCSV(clients: ClientProfitability[]): string {
  const headers = ['Client Name', 'Total Revenue', 'Total COGS', 'Profit', 'Profit Margin (%)'];
  const rows = clients.map(c => [
    c.client.name,
    c.totalRevenue.toFixed(2),
    c.totalCOGS.toFixed(2),
    c.profit.toFixed(2),
    c.profitMargin.toFixed(1),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateOrdersCSV(orders: ClientOrder[], clients: ClientProfitability[], products: MatchaProduct[]): string {
  const clientMap = new Map(clients.map(c => [c.client.id, c.client.name]));
  const productMap = new Map(products.map(p => [p.id, p.name]));

  const headers = ['Order Date', 'Client', 'Product', 'Quantity (kg)', 'Unit Price', 'Total Revenue', 'Status'];
  const rows = orders.map(o => [
    format(new Date(o.order_date), 'yyyy-MM-dd'),
    clientMap.get(o.client_id) || 'Unknown',
    productMap.get(o.product_id) || 'Unknown',
    o.quantity_kg.toString(),
    o.unit_price.toFixed(2),
    o.total_revenue.toFixed(2),
    o.status,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateForecastCSV(forecast: { month: string; revenue: number; cogs: number; profit: number }[]): string {
  const headers = ['Month', 'Projected Revenue', 'Projected COGS', 'Projected Profit'];
  const rows = forecast.map(f => [
    f.month,
    f.revenue.toFixed(2),
    f.cogs.toFixed(2),
    f.profit.toFixed(2),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// PDF Export
export function exportToPDF(data: ExportData, reportType: 'profitability' | 'orders' | 'forecast' | 'full') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(34, 74, 52); // Dark green
  doc.text('Matsu Matcha', 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Financial Report - ${format(new Date(), 'MMMM d, yyyy')}`, 14, 28);
  
  let yPos = 40;

  switch (reportType) {
    case 'profitability':
      yPos = addProfitabilitySection(doc, data.clients, yPos);
      break;
    case 'orders':
      yPos = addOrdersSection(doc, data.orders, data.clients, data.products, yPos);
      break;
    case 'forecast':
      if (data.forecast) {
        yPos = addForecastSection(doc, data.forecast, yPos);
      }
      if (data.analysis) {
        yPos = addAnalysisSection(doc, data.analysis, yPos);
      }
      break;
    case 'full':
      yPos = addSummarySection(doc, data, yPos);
      yPos = addProfitabilitySection(doc, data.clients, yPos);
      if (data.forecast) {
        yPos = addForecastSection(doc, data.forecast, yPos);
      }
      break;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `matsu-matcha-${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

function addSummarySection(doc: jsPDF, data: ExportData, startY: number): number {
  doc.setFontSize(14);
  doc.setTextColor(34, 74, 52);
  doc.text('Executive Summary', 14, startY);

  const totalRevenue = data.clients.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalProfit = data.clients.reduce((sum, c) => sum + c.profit, 0);
  const avgMargin = data.clients.length > 0 
    ? data.clients.reduce((sum, c) => sum + c.profitMargin, 0) / data.clients.length 
    : 0;

  doc.setFontSize(10);
  doc.setTextColor(60);
  
  const summaryData = [
    ['Total Revenue', `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Total Profit', `$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Average Margin', `${avgMargin.toFixed(1)}%`],
    ['Active Clients', data.clients.length.toString()],
    ['Total Orders', data.orders.length.toString()],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 60 },
    },
  });

  return (doc as any).lastAutoTable.finalY + 15;
}

function addProfitabilitySection(doc: jsPDF, clients: ClientProfitability[], startY: number): number {
  doc.setFontSize(14);
  doc.setTextColor(34, 74, 52);
  doc.text('Client Profitability', 14, startY);

  const tableData = clients.slice(0, 15).map(c => [
    c.client.name,
    `$${c.totalRevenue.toFixed(2)}`,
    `$${c.totalCOGS.toFixed(2)}`,
    `$${c.profit.toFixed(2)}`,
    `${c.profitMargin.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['Client', 'Revenue', 'COGS', 'Profit', 'Margin']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 74, 52], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });

  return (doc as any).lastAutoTable.finalY + 15;
}

function addOrdersSection(doc: jsPDF, orders: ClientOrder[], clients: ClientProfitability[], products: MatchaProduct[], startY: number): number {
  const clientMap = new Map(clients.map(c => [c.client.id, c.client.name]));
  const productMap = new Map(products.map(p => [p.id, p.name]));

  doc.setFontSize(14);
  doc.setTextColor(34, 74, 52);
  doc.text('Sales Orders', 14, startY);

  const tableData = orders.slice(0, 20).map(o => [
    format(new Date(o.order_date), 'MMM d, yyyy'),
    clientMap.get(o.client_id) || 'Unknown',
    productMap.get(o.product_id) || 'Unknown',
    `${o.quantity_kg} kg`,
    `$${o.total_revenue.toFixed(2)}`,
    o.status,
  ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['Date', 'Client', 'Product', 'Qty', 'Revenue', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 74, 52], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  return (doc as any).lastAutoTable.finalY + 15;
}

function addForecastSection(doc: jsPDF, forecast: { month: string; revenue: number; cogs: number; profit: number }[], startY: number): number {
  doc.setFontSize(14);
  doc.setTextColor(34, 74, 52);
  doc.text('Quarterly Forecast', 14, startY);

  const tableData = forecast.map(f => [
    f.month,
    `$${f.revenue.toFixed(2)}`,
    `$${f.cogs.toFixed(2)}`,
    `$${f.profit.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['Month', 'Projected Revenue', 'Projected COGS', 'Projected Profit']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 74, 52], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  return (doc as any).lastAutoTable.finalY + 15;
}

function addAnalysisSection(doc: jsPDF, analysis: string, startY: number): number {
  // Check if we need a new page
  if (startY > 240) {
    doc.addPage();
    startY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(34, 74, 52);
  doc.text('AI Analysis', 14, startY);

  doc.setFontSize(9);
  doc.setTextColor(60);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - 28;
  const lines = doc.splitTextToSize(analysis, maxWidth);
  
  doc.text(lines, 14, startY + 8);

  return startY + 8 + (lines.length * 4) + 15;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
