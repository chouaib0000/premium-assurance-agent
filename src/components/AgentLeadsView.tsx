import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import * as XLSX from 'xlsx';

export default function AgentLeadsView() {
  const { user } = useAuth();
  console.log('👤 AgentLeadsView - Current user:', user);
  const { leads, loading, updateLead } = useLeads(user?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const exportToExcel = () => {
    const exportData = filteredLeads.map(lead => ({
      'Lead Name': lead.name,
      'Email': lead.email || '',
      'Phone': lead.phone || '',
      'Company': lead.company || '',
      'Status': lead.status,
      'Notes': lead.notes || '',
      'Created': new Date(lead.created_at).toLocaleDateString(),
      'Last Updated': new Date(lead.updated_at).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'My Leads');
    XLSX.writeFile(wb, `my_leads_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToTxt = () => {
    const exportData = filteredLeads.map(lead => `Lead: ${lead.name}
Email: ${lead.email || 'N/A'}
Phone: ${lead.phone || 'N/A'}
Company: ${lead.company || 'N/A'}
Status: ${lead.status}
Notes: ${lead.notes || 'N/A'}
Created: ${new Date(lead.created_at).toLocaleDateString()}
Last Updated: ${new Date(lead.updated_at).toLocaleDateString()}
${'='.repeat(50)}`
    ).join('\n\n');

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_leads_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    await updateLead(leadId, { status: status as any });
  };

  const handleNotesUpdate = async (leadId: string) => {
    await updateLead(leadId, { notes: notesValue });
    setEditingNotes(null);
    setNotesValue('');
  };

  const startEditNotes = (lead: any) => {
    setEditingNotes(lead.id);
    setNotesValue(lead.notes || '');
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    converted: 'bg-green-100 text-green-800',
    lost: 'bg-gray-100 text-gray-800',
  };

  const statusCounts = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  if (loading) {
    return <div className="p-6">Loading your leads...</div>;
  }

  return (
    <div className="p-6">
      {/* Quick Start Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Mes Leads</h2>
            <p className="text-blue-100">Gérez vos leads et suivez leur progression</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Liste des Leads</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={exportToTxt}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export TXT
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{statusCounts.total}</div>
          <div className="text-sm opacity-90">Total Leads</div>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{statusCounts.new}</div>
          <div className="text-sm opacity-90">New</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{statusCounts.contacted}</div>
          <div className="text-sm opacity-90">Contacted</div>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{statusCounts.qualified}</div>
          <div className="text-sm opacity-90">Qualified</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{statusCounts.converted}</div>
          <div className="text-sm opacity-90">Converted</div>
        </div>
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{statusCounts.lost}</div>
          <div className="text-sm opacity-90">Lost</div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLeads.map((lead) => (
          <div key={lead.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
                <p className="text-sm text-gray-600">{lead.company || 'No company'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[lead.status]}`}>
                {lead.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-sm font-medium text-gray-900">{lead.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-sm font-medium text-gray-900">{lead.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Notes</p>
              {editingNotes === lead.id ? (
                <div>
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNotesUpdate(lead.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingNotes(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => startEditNotes(lead)}
                  className="text-sm text-gray-900 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-300"
                >
                  {lead.notes || 'Click to add notes...'}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">
                  Created: {new Date(lead.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  Updated: {new Date(lead.updated_at).toLocaleDateString()}
                </p>
              </div>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {leads.length === 0
            ? 'No leads assigned yet. Your admin will assign leads to you soon.'
            : 'No leads match your filters.'}
        </div>
      )}
    </div>
  );
}