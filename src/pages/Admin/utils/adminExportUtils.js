import { formatCurrency, formatDate } from './adminDashboardUtils';

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const truncate = (value = '', maxLength = 160) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

const downloadFileName = (label, extension) => {
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `worksync-${safeLabel}-${new Date().toISOString().slice(0, 10)}.${extension}`;
};

const exportRows = {
  dashboard: ({ metrics = {} }) => ({
    label: 'dashboard-summary',
    rows: [
      { Metric: 'Total Users', Value: metrics.totalUsers ?? 0 },
      { Metric: 'Paid Users', Value: metrics.totalPaidUsers ?? 0 },
      { Metric: 'Super Admins', Value: metrics.totalSuperAdmins ?? 0 },
      { Metric: 'Suspended Users', Value: metrics.totalSuspendedUsers ?? 0 },
      { Metric: 'Workspaces', Value: metrics.totalWorkspaces ?? 0 },
      { Metric: 'Archived Workspaces', Value: metrics.totalArchivedWorkspaces ?? 0 },
      { Metric: 'Channels', Value: metrics.totalChannels ?? 0 },
      { Metric: 'Messages', Value: metrics.totalMessages ?? 0 },
      { Metric: 'Deleted Messages', Value: metrics.totalDeletedMessages ?? 0 },
      { Metric: 'Payments', Value: metrics.totalPayments ?? 0 },
      { Metric: 'Revenue', Value: formatCurrency(metrics.grossRevenue ?? 0) }
    ]
  }),
  users: ({ users = [] }) => ({
    label: 'users',
    rows: users.map((user) => ({
      Username: user.username,
      Email: user.email,
      Plan: user.plan,
      'Super Admin': user.isSuperAdmin ? 'Yes' : 'No',
      Status: user.isActive ? 'Active' : 'Suspended',
      'Workspace Count': user.workspaceCount,
      'Owned Workspaces': user.ownedWorkspaceCount,
      Joined: formatDate(user.createdAt)
    }))
  }),
  workspaces: ({ workspaces = [] }) => ({
    label: 'workspaces',
    rows: workspaces.map((workspace) => ({
      Workspace: workspace.name,
      Owner: workspace.owner?.email || 'Unknown',
      Members: workspace.memberCount,
      Channels: workspace.channelCount,
      Archived: workspace.isArchived ? 'Yes' : 'No',
      Created: formatDate(workspace.createdAt)
    }))
  }),
  moderation: ({ messages = [] }) => ({
    label: 'message-moderation',
    rows: messages.map((message) => ({
      Sender: message.sender?.email || 'Unknown',
      Channel: message.channel?.name || 'Unknown',
      Message: truncate(stripHtml(message.body || '')),
      Deleted: message.deletedAt ? 'Yes' : 'No',
      Created: formatDate(message.createdAt)
    }))
  }),
  payments: ({ payments = [] }) => ({
    label: 'payments',
    rows: payments.map((payment) => ({
      User: payment.user?.email || 'Unknown',
      Status: payment.status,
      Amount: formatCurrency(payment.amount),
      Order: payment.orderId,
      Payment: payment.paymentId || 'Pending',
      Created: formatDate(payment.createdAt)
    }))
  }),
  'audit-logs': ({ auditLogs = [] }) => ({
    label: 'audit-logs',
    rows: auditLogs.map((log) => ({
      Action: log.action,
      Actor: log.actor?.email || 'System',
      Target: log.targetType,
      'Target ID': log.targetId || 'N/A',
      Created: formatDate(log.createdAt)
    }))
  })
};

export const getAdminExportPayload = (section, data) => {
  const builder = exportRows[section];
  if (!builder) {
    return null;
  }

  return builder(data);
};

export const exportAdminRowsToExcel = async ({ label, rows }) => {
  if (!rows?.length) {
    return false;
  }

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = Object.keys(rows[0]).map((key) => ({
    wch: Math.max(
      key.length + 4,
      ...rows.map((row) => String(row[key] ?? '').length + 2).slice(0, 25)
    )
  }));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
  XLSX.writeFile(workbook, downloadFileName(label, 'xlsx'));
  return true;
};

export const exportAdminRowsToPdf = async ({ label, rows }) => {
  if (!rows?.length) {
    return false;
  }

  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const document = new jsPDF({
    orientation: rows.length > 6 ? 'landscape' : 'portrait'
  });

  document.setFontSize(16);
  document.text(`WorkSync ${label}`, 14, 18);
  document.setFontSize(10);
  document.text(`Generated ${new Date().toLocaleString()}`, 14, 24);

  autoTable(document, {
    head: [Object.keys(rows[0])],
    body: rows.map((row) => Object.values(row)),
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [97, 31, 105]
    },
    alternateRowStyles: {
      fillColor: [248, 244, 250]
    }
  });

  document.save(downloadFileName(label, 'pdf'));
  return true;
};
