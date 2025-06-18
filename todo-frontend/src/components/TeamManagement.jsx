import React, { useEffect, useState } from 'react';
import { inviteTeamMember, updateMemberRole, removeMember, getProjectMembers } from '../api/AxiosAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
const TeamManagement = ({ project, onClose }) => {
    const [members, setMembers] = useState([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);




    useEffect(()=>{
                fetchMembers();
    }, [project.id])
        
        const fetchMembers = async () => {
            try {
                const response = await getProjectMembers(project.id);
                setMembers(response.data);
                // const data = await response.json();
                // setMembers(data);
            } catch (error) {
                console.error('Failed to fetch members:', error);
            }
        };



    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await inviteTeamMember(project.id, { email, role });
            setEmail('');
            setRole('member');
            // Refresh project data
            onClose();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to invite team member');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            await updateMemberRole(project.id, memberId, newRole);
            await fetchMembers();
            // Refresh project data
            onClose();
            if (onUpdate) onUpdate();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            await removeMember(project.id, memberId);
            await fetchMembers();
            if (onUpdate) onUpdate();
            // Refresh project data
            onClose();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to remove member');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Team Management</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleInvite} className="mb-6">
                    <div className="flex gap-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 border p-2 rounded bg-slate-200 placeholder:text-black"
                            required
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="border p-2 bg-violet-500/80 text-white rounded"
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Inviting...' : 'Invite'}
                        </Button>
                    </div>
                </form>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Current Team Members</h3>
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                            <div>
                                <p className="font-medium">{member.user.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <select
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                    className="border p-1 rounded bg-violet-500/80"
                                    disabled={member.id === project.owner.id}
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                                {member.id !== project.owner.id && (
                                    <Button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamManagement; 