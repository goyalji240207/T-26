import React, { useState, useEffect } from 'react';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

const AdminRegistrations = () => {
  const [activeTab, setActiveTab] = useState('workshops'); // 'workshops' | 'competitions'
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);

  // Get current user and ID token
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const token = await currentUser.getIdToken();
        setIdToken(token);
      } else {
        setUser(null);
        setIdToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === "workshops" && idToken && registrations.length === 0) {
      fetchWorkshopRegistrations();
    }
  }, [activeTab, idToken]);

  const fetchWorkshopRegistrations = async () => {
    if (!idToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/workshops/registrations/workshops', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRegistrations(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch registrations');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setError('Error fetching registrations');
    } finally {
      setLoading(false);
    }
  };

  const updateApprovalStatus = async (userId, workshopId, status) => {
    if (!idToken) return;
    try {
      const response = await fetch(`http://localhost:5000/api/workshops/registrations/workshops/${userId}/${workshopId}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        alert("Approval status updated successfully");
        setRegistrations((prev) =>
          prev.map((r) =>
            r.userId === userId && r.workshopId === workshopId
              ? { ...r, approval: status }
              : r
          )
        );
      } else {
        alert(`Failed to update approval: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Error updating approval. Please try again.');
    }
  };

  const formatDate = (val) => {
    try {
      if (!val) return '';
      if (typeof val?.toDate === 'function') return val.toDate().toLocaleDateString();
      if (val?._seconds) return new Date(val._seconds * 1000).toLocaleDateString();
      const d = new Date(val);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const filteredRegistrations = registrations.filter(registration => {
    const matchesStatus = filterStatus === 'all' || registration.paymentStatus === filterStatus;
    const matchesSearch = searchTerm === '' || 
      registration.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.workshopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.userTechId.toString().includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Admin Registrations</h2>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading registrations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Registrations</h2>
      {/* Tabs */}
      <div className="mb-6 border-b">
        <nav className="-mb-px flex space-x-6">
          <button
            className={`px-3 py-2 border-b-2 ${activeTab === 'workshops' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('workshops')}
          >
            Workshops
          </button>
          <button
            className={`px-3 py-2 border-b-2 ${activeTab === 'competitions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('competitions')}
          >
            Competitions
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Registrations</option>
              <option value="pending">Payment Pending</option>
              <option value="completed">Payment Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search:</label>
            <input
              type="text"
              placeholder="Search by name, email, tech ID, or workshop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-64"
            />
          </div>
          
          <div className="ml-auto">
            <button
              onClick={fetchWorkshopRegistrations}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700">Total Registrations</h3>
          <p className="text-2xl font-bold text-blue-600">{registrations.length}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700">Payment Completed</h3>
          <p className="text-2xl font-bold text-green-600">
            {registrations.filter(r => r.paymentStatus === 'completed').length}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700">Payment Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {registrations.filter(r => r.paymentStatus === 'pending').length}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
          <p className="text-2xl font-bold text-purple-600">
            ₹{registrations.filter(r => r.paymentStatus === 'completed').reduce((sum, r) => sum + (parseFloat(r.workshopFee) || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'workshops' ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workshop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={`${registration.userId}-${registration.workshopId}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{registration.userName}</div>
                        <div className="text-sm text-gray-500">{registration.userEmail}</div>
                        <div className="text-sm text-gray-500">TechID: {registration.userTechId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{registration.workshopName}</div>
                        {(registration.workshopDate || registration.workshopTime) && (
                          <div className="text-sm text-gray-500">{registration.workshopDate || ''} {registration.workshopTime || ''}</div>
                        )}
                        {registration.workshopLocation && (
                          <div className="text-sm text-gray-500">{registration.workshopLocation}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{registration.workshopFee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(registration.paymentStatus)}`}>
                        {registration.paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${registration.approval === 'approved' ? 'bg-green-100 text-green-800' : registration.approval === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {registration.approval?.charAt(0).toUpperCase() + registration.approval?.slice(1) || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(registration.registrationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3 items-center">
                        {registration.receiptUrl && (
                          <a
                            href={registration.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Receipt
                          </a>
                        )}
                        <button
                          onClick={() => updateApprovalStatus(registration.userId, registration.workshopId, 'approved')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateApprovalStatus(registration.userId, registration.workshopId, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Disapprove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No registrations found matching your criteria.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600">Competitions tab is coming soon.</p>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrations;