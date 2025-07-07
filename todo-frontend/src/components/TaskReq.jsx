import { useEffect, useState } from "react";
import { getTaskRequests, approveTaskRequest, rejectTaskRequest } from "../api/AxiosAuth";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function TaskRequestsPanel({ projectId }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await getTaskRequests(projectId);
        setRequests(res.data);
      } catch (err) {
        // toast.error("Failed to fetch task requests");
      }
    };
    fetchRequests();
  }, [projectId]);

  const handleApprove = async (id) => {
    try {
      await approveTaskRequest(id);
      toast.success("Task approved!");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectTaskRequest(id);
      toast.success("Task rejected!");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Rejection failed");
    }
  };

  return (
    <div>
      <h3>Pending Task Requests</h3>
      {requests.filter(r => r.status === "pending").length === 0 && <p>No pending requests.</p>}
      {requests.filter(r => r.status === "pending").map((req) => (
        <div key={req.id} className="border p-2 mb-2 rounded">
          <div><b>Title:</b> {req.title}</div>
          <div><b>Description:</b> {req.description}</div>
          <div><b>Requested by:</b> {req.requested_by?.username}</div>
          <Button onClick={() => handleApprove(req.id)} className="mr-2">Approve</Button>
          <Button onClick={() => handleReject(req.id)} variant="outline">Reject</Button>
        </div>
      ))}
    </div>
  );
}