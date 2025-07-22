// src/components/Workspace/WorkspaceMembers.jsx
import { useWorkspaceMembers } from "../../hooks/useWorkspaceMembers";
import { UserCircle } from "lucide-react";
import React from "react";
import { Tooltip } from "react-tooltip";

export default function WorkspaceMembers({ workspaceId, size = 6 }) {
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);

  if (isLoading)
    return (
      <div className="flex gap-1 animate-pulse text-xs text-gray-400">...</div>
    );

  if (!members || members.length === 0)
    return <span className="text-gray-300 text-xs">Sin miembros</span>;

  return (
    <div className="flex items-center -space-x-2">
      {members.slice(0, size).map((m) => {
        const user = m.user;
        const name =
          user?.first_name || (user?.email ? user.email.split("@")[0] : "S/N");

        return (
          <div
            key={user.id}
            data-tooltip-id={`member-tooltip-${workspaceId}`}
            data-tooltip-content={user.email}
            data-tooltip-place="top"
            className="cursor-pointer"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={name}
                className="w-7 h-7 rounded-full border-2 border-white shadow object-cover bg-gray-100"
                onError={(e) => (e.target.src = "")}
                style={{ minWidth: 28 }}
              />
            ) : (
              <div className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-white bg-gray-200 text-gray-500 font-bold text-xs">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      })}
      {members.length > size && (
        <span className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-gray-700">
          +{members.length - size}
        </span>
      )}
      {/* Renderiza el tooltip UNA SOLA VEZ por workspaceId */}
      <Tooltip id={`member-tooltip-${workspaceId}`} />
    </div>
  );
}
