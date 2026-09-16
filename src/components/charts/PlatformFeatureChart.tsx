import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { FeatureStat, PlatformStat, OsStat } from '../../types';
import { Zap, Monitor, Smartphone, Globe } from 'lucide-react';

interface PlatformFeatureChartProps {
  featureStats: FeatureStat[];
  platformStats: PlatformStat[];
  osStats: OsStat[];
  onSelectFeature?: (feature: string) => void;
  onSelectPlatform?: (platform: string) => void;
}

const FEATURE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
const OS_COLORS = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#dc2626', '#475569'];

export function PlatformFeatureChart({
  featureStats,
  platformStats,
  osStats,
  onSelectFeature,
  onSelectPlatform,
}: PlatformFeatureChartProps) {
  const [subTab, setSubTab] = useState<'features' | 'os'>('features');

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {subTab === 'features' ? (
              <>
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Phân Bố Chức Năng Được Sử Dụng</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 text-sky-600" />
                <span>Hệ Điều Hành & Nền Tảng Thiết Bị</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {subTab === 'features'
              ? 'Tỷ trọng các tính năng (Story, statistics, breaking_news...)'
              : 'Thống kê thiết bị: Windows, MacOS, iOS, Android, Linux'}
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setSubTab('features')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              subTab === 'features' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chức Năng
          </button>
          <button
            onClick={() => setSubTab('os')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              subTab === 'os' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hệ Điều Hành
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {subTab === 'features' ? (
              <PieChart>
                <Pie
                  data={featureStats}
                  dataKey="count"
                  nameKey="feature"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={(entry: any) => onSelectFeature?.(entry.feature || entry.name)}
                >
                  {featureStats.map((_, index) => (
                    <Cell key={`cell-feat-${index}`} fill={FEATURE_COLORS[index % FEATURE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any, item: any) => [
                    `${value} lượt (${item.payload.percentage}%)`,
                    `Chức năng: ${name}`,
                  ]}
                />
              </PieChart>
            ) : (
              <PieChart>
                <Pie
                  data={osStats}
                  dataKey="count"
                  nameKey="os"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {osStats.map((_, index) => (
                    <Cell key={`cell-os-${index}`} fill={OS_COLORS[index % OS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any, item: any) => [
                    `${value} lượt (${item.payload.percentage}%)`,
                    `Hệ điều hành: ${name}`,
                  ]}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend & Breakdown List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {subTab === 'features'
            ? featureStats.map((feat, idx) => (
                <div
                  key={feat.feature}
                  onClick={() => onSelectFeature?.(feat.feature)}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: FEATURE_COLORS[idx % FEATURE_COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-800">{feat.feature}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{feat.count}</span>
                    <span className="text-slate-400 ml-1">({feat.percentage}%)</span>
                  </div>
                </div>
              ))
            : osStats.map((item, idx) => (
                <div
                  key={item.os}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: OS_COLORS[idx % OS_COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-800">{item.os}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{item.count}</span>
                    <span className="text-slate-400 ml-1">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Footer summary: Platform Quick Ratio */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">Tỷ lệ Nền tảng:</span>
          {platformStats.map((p) => (
            <button
              key={p.platform}
              onClick={() => onSelectPlatform?.(p.platform)}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium cursor-pointer"
            >
              {p.platform === 'WEB' ? <Globe className="w-3 h-3 text-blue-500" /> : <Smartphone className="w-3 h-3 text-emerald-500" />}
              {p.platform}: <strong>{p.count}</strong> ({p.percentage}%)
            </button>
          ))}
        </div>
        <span className="text-slate-400">Click để lọc</span>
      </div>
    </div>
  );
}
