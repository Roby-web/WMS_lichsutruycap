import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
  Smartphone,
  User,
  Shield,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from 'lucide-react';
import { AccessRecord } from '../types';

interface DataTableProps {
  records: AccessRecord[];
  selectedAccount?: string;
  onSelectAccount: (account: string) => void;
  onSelectDepartment: (dept: string) => void;
  onOpenDetailModal?: (account: string) => void;
}

type SortField = 'stt' | 'account' | 'feature' | 'timestamp' | 'platform' | 'os' | 'department' | 'ip';

export function DataTable({
  records,
  selectedAccount,
  onSelectAccount,
  onSelectDepartment,
  onOpenDetailModal,
}: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Sorting
  const sortedRecords = useMemo(() => {
    const list = [...records];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'timestamp') {
        valA = a.timestamp;
        valB = b.timestamp;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
    return list;
  }, [records, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getPlatformBadge = (platform: string) => {
    if (platform === 'WEB') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Globe className="w-3 h-3 text-blue-500" />
          WEB
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Smartphone className="w-3 h-3 text-emerald-500" />
        APP
      </span>
    );
  };

  const getFeatureBadge = (feature: string) => {
    switch (feature) {
      case 'Story':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-150">Story</span>;
      case 'statistics':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">statistics</span>;
      case 'breaking_news':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">breaking_news</span>;
      case 'Notifications':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">Notifications</span>;
      case 'Topic':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">Topic</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">{feature}</span>;
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 ml-1" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900">Chi Tiết Lịch Sử Truy Cập</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng <strong>{records.length}</strong> bản ghi lịch sử truy cập phù hợp với bộ lọc
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Bản ghi/trang:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th
                onClick={() => handleSort('stt')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none w-16"
              >
                <div className="flex items-center">
                  <span>STT</span>
                  {renderSortIcon('stt')}
                </div>
              </th>
              <th
                onClick={() => handleSort('account')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center">
                  <span>Tài Khoản</span>
                  {renderSortIcon('account')}
                </div>
              </th>
              <th
                onClick={() => handleSort('feature')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center">
                  <span>Chức Năng</span>
                  {renderSortIcon('feature')}
                </div>
              </th>
              <th
                onClick={() => handleSort('timestamp')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center">
                  <span>Thời Gian</span>
                  {renderSortIcon('timestamp')}
                </div>
              </th>
              <th
                onClick={() => handleSort('platform')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center">
                  <span>Nền Tảng</span>
                  {renderSortIcon('platform')}
                </div>
              </th>
              <th
                onClick={() => handleSort('os')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center">
                  <span>Hệ Điều Hành</span>
                  {renderSortIcon('os')}
                </div>
              </th>
              <th
                onClick={() => handleSort('department')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center">
                  <span>Ban Biên Tập</span>
                  {renderSortIcon('department')}
                </div>
              </th>
              <th className="py-3 px-3 text-slate-600 select-none">
                <span>Vai Trò</span>
              </th>
              <th
                onClick={() => handleSort('ip')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center">
                  <span>IP</span>
                  {renderSortIcon('ip')}
                </div>
              </th>
              <th className="py-3 px-3 text-right">
                <span>Thao Tác</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  Không tìm thấy bản ghi nào khớp với điều kiện tìm kiếm.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr
                  key={record.stt}
                  className={`transition-colors group ${
                    selectedAccount === record.account ? 'bg-blue-50/60 font-medium' : 'hover:bg-blue-50/40'
                  }`}
                >
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    #{record.stt}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onSelectAccount(record.account)}
                      className={`cursor-pointer flex items-center gap-1.5 hover:underline ${
                        selectedAccount === record.account
                          ? 'font-extrabold text-blue-700'
                          : 'font-bold text-slate-800 group-hover:text-blue-600'
                      }`}
                      title="Click để lọc toàn bộ dashboard theo tài khoản này"
                    >
                      <User className={`w-3.5 h-3.5 ${selectedAccount === record.account ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
                      <span>{record.account}</span>
                      {selectedAccount === record.account && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-semibold">
                          Đang lọc
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-3">
                    {getFeatureBadge(record.feature)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    <div>{record.time}</div>
                    <div className="text-[10px] text-slate-400">{record.date}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    {getPlatformBadge(record.platform)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-400" />
                      {record.os}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onSelectDepartment(record.department)}
                      className="text-slate-700 hover:text-blue-600 font-medium hover:underline cursor-pointer"
                    >
                      {record.department}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {record.role}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {record.ip}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        if (onOpenDetailModal) {
                          onOpenDetailModal(record.account);
                        } else {
                          onSelectAccount(record.account);
                        }
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors cursor-pointer"
                      title="Xem hồ sơ & lịch sử tài khoản"
                    >
                      Hồ sơ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, sortedRecords.length)}</strong> -{' '}
          <strong>{Math.min(currentPage * pageSize, sortedRecords.length)}</strong> trên{' '}
          <strong>{sortedRecords.length}</strong> bản ghi
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
