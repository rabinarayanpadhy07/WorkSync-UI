import { CreditCard, ScrollText } from 'lucide-react';

import { AdminEmptyState } from './AdminEmptyState';
import { AdminSectionCard } from './AdminSectionCard';
import { AdminPill } from './AdminPill';
import { AdminTrendsChart } from './AdminTrendsChart';
import {
    formatCurrency,
    formatDate,
    getInitials,
    innerCardClass
} from '../utils/adminDashboardUtils';

export const AdminOverviewActivity = ({ overview }) => (
    <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
        <AdminTrendsChart trends={overview?.trends} />

        <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] 2xl:gap-10">
            <AdminSectionCard
                title="Recent Users"
                description="Newest accounts, plan status, and access posture."
            >
                {(overview?.recentUsers || []).length === 0 && (
                    <AdminEmptyState
                        title="No users yet"
                        description="New signups will appear here as soon as they join the platform."
                    />
                )}
                {(overview?.recentUsers || []).map((user) => (
                    <div key={user._id} className={innerCardClass}>
                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#36C5F0]/30 bg-[#36C5F0]/12 text-sm font-semibold text-[#a5e9fc]">
                                    {getInitials(user.username || user.email)}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-[#f8f8f8]">{user.username}</p>
                                        <AdminPill tone={user.plan === 'Paid' ? 'amber' : 'slate'}>
                                            {user.plan}
                                        </AdminPill>
                                        {user.isSuperAdmin && <AdminPill tone="sky">Super Admin</AdminPill>}
                                    </div>
                                    <p className="mt-2 text-sm text-[#c9b8cc]">{user.email}</p>
                                </div>
                            </div>
                            <p className="text-xs text-[#a49ba8]">{formatDate(user.createdAt)}</p>
                        </div>
                    </div>
                ))}
            </AdminSectionCard>

            <div className="space-y-6">
                <AdminSectionCard
                    title="Recent Payments"
                    description="Latest successful and pending platform transactions."
                >
                    {(overview?.recentPayments || []).length === 0 && (
                        <AdminEmptyState
                            title="No payments yet"
                            description="Successful and pending transactions will show up here."
                        />
                    )}
                    {(overview?.recentPayments || []).map((payment) => (
                        <div key={payment._id} className={innerCardClass}>
                            <div className="flex items-center justify-between gap-4 p-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#2EB67D]/30 bg-[#2EB67D]/12 text-[#b8efd4]">
                                        <CreditCard className="size-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#f8f8f8]">
                                            {payment.user?.email || 'Unlinked payment'}
                                        </p>
                                        <p className="mt-1 text-xs text-[#a49ba8]">{payment.orderId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-[#f8f8f8]">
                                        {formatCurrency(payment.amount)}
                                    </p>
                                    <p className="text-xs text-[#a49ba8]">{payment.status}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </AdminSectionCard>

                <AdminSectionCard
                    title="Recent Audit Logs"
                    description="Most recent high-impact administrative actions."
                >
                    {(overview?.recentAuditLogs || []).length === 0 && (
                        <AdminEmptyState
                            title="No audit activity yet"
                            description="Administrative actions like suspensions or archives will be logged here."
                        />
                    )}
                    {(overview?.recentAuditLogs || []).map((log) => (
                        <div key={log._id} className={innerCardClass}>
                            <div className="flex items-start gap-4 p-5">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#611f69]/40 bg-[#611f69]/18 text-[#e8d4eb]">
                                    <ScrollText className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-[#f8f8f8]">{log.action}</p>
                                        <AdminPill tone="sky">{log.targetType}</AdminPill>
                                    </div>
                                    <p className="mt-2 text-sm text-[#c9b8cc]">
                                        {log.actor?.email || 'System'}
                                    </p>
                                    <p className="mt-1 text-xs text-[#a49ba8]">{formatDate(log.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </AdminSectionCard>
            </div>
        </div>
    </div>
);
