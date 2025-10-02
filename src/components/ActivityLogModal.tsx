import React from 'react';
import { X, FileText } from 'lucide-react';
import type { Database } from '../lib/supabase';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

interface ActivityLogModalProps {
  activityLogs: ActivityLog[];
  onClose: () => void;
}

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ activityLogs, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Journal d'activité
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="max-h-96 overflow-y-auto">
            {activityLogs.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className="text-gray-600 ml-2">{log.details}</span>
                      <div className="text-sm text-gray-500 mt-1">
                        Par: {log.user_name}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune activité enregistrée</p>
                <p className="text-sm">Les activités apparaîtront ici une fois qu'elles seront effectuées</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogModal;