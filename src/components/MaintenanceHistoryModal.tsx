import React from 'react';
import { X, Wrench, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Vehicle } from '../types';

interface MaintenanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

export function MaintenanceHistoryModal({ isOpen, onClose, vehicle }: MaintenanceHistoryModalProps) {
  // In a real app, this would be fetched from Firestore
  const fullHistory = [
    { id: '1', date: 'Jan 12, 2026', type: 'Routine', desc: 'Oil change & filter replacement', status: 'Completed', cost: '$120.00', technician: 'Mike R.' },
    { id: '2', date: 'Nov 05, 2025', type: 'Repair', desc: 'Brake pad replacement (Front)', status: 'Completed', cost: '$450.00', technician: 'Sarah J.' },
    { id: '3', date: 'Aug 20, 2025', type: 'Inspection', desc: 'Annual safety certification', status: 'Completed', cost: '$85.00', technician: 'David L.' },
    { id: '4', date: 'May 15, 2025', type: 'Routine', desc: 'Tire rotation & balance', status: 'Completed', cost: '$60.00', technician: 'Mike R.' },
    { id: '5', date: 'Feb 10, 2025', type: 'Repair', desc: 'Battery replacement', status: 'Completed', cost: '$180.00', technician: 'Sarah J.' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-accent text-white rounded-xl shadow-lg shadow-blue-100">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Maintenance History</h2>
                  <p className="text-sm text-slate-500 font-medium">Full service logs for {vehicle.id}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {fullHistory.map((record) => (
                  <div 
                    key={record.id}
                    className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand-accent/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          record.type === 'Repair' ? "bg-rose-50 text-rose-600" : 
                          record.type === 'Routine' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {record.type === 'Repair' ? <AlertCircle className="w-4 h-4" /> : 
                           record.type === 'Routine' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{record.desc}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.date}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.technician}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{record.cost}</p>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{record.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
              >
                Close History
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
