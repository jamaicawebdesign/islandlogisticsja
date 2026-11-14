import React from 'react';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { BarChart3, PieChart, TrendingUp, Users, DollarSign, Package } from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

const PIE_DATA = [
  { name: 'On Time', value: 85, color: '#10B981' },
  { name: 'Delayed', value: 10, color: '#F59E0B' },
  { name: 'Failed', value: 5, color: '#EF4444' },
];

const MONTHLY_DATA = [
  { name: 'Jan', shipments: 850, revenue: 125000 },
  { name: 'Feb', shipments: 920, revenue: 142000 },
  { name: 'Mar', shipments: 1100, revenue: 168000 },
  { name: 'Apr', shipments: 1050, revenue: 155000 },
  { name: 'May', shipments: 1300, revenue: 195000 },
  { name: 'Jun', shipments: 1450, revenue: 215000 },
];

export function AnalyticsView() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 mt-1">Deep dive into operational efficiency and financial metrics.</p>
        </div>
        <div className="flex gap-3">
          <select className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl outline-none shadow-sm">
            <option>Last 6 Months</option>
            <option>Last Year</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalyticsChart />
        
        <div className="glass-card p-6 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Delivery Success Rate</h3>
          <p className="text-sm text-slate-500 mb-8">Performance breakdown by status</p>
          
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
            
            <div className="flex flex-col gap-4 ml-8">
              {PIE_DATA.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                  <span className="text-sm font-bold text-slate-900 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Bar Chart */}
      <div className="glass-card p-6 h-[500px] flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Monthly Performance</h3>
            <p className="text-sm text-slate-500">Revenue vs. Shipment Volume</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-accent"></div>
              <span className="text-xs font-medium text-slate-600">Revenue ($)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span className="text-xs font-medium text-slate-600">Shipments</span>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MONTHLY_DATA}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <ReTooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="revenue" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
              <Bar 
                yAxisId="right"
                dataKey="shipments" 
                fill="#cbd5e1" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">Revenue Growth</h4>
          </div>
          <p className="text-3xl font-bold text-slate-900">+24.5%</p>
          <p className="text-sm text-slate-500 mt-1">vs. previous month</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">Operational Cost</h4>
          </div>
          <p className="text-3xl font-bold text-slate-900">-12.3%</p>
          <p className="text-sm text-slate-500 mt-1">Optimized routes impact</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">Driver Satisfaction</h4>
          </div>
          <p className="text-3xl font-bold text-slate-900">4.8/5.0</p>
          <p className="text-sm text-slate-500 mt-1">Based on weekly surveys</p>
        </div>
      </div>
    </div>
  );
}
