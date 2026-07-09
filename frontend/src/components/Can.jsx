import { useAuth } from '../contexts/AuthContext';

// Hook form of permission gating.
export const usePermissions = () => {
  const { permissions, hasPermission, hasAnyPermission } = useAuth();
  return { permissions, hasPermission, hasAnyPermission };
};

/**
 * Conditionally render children based on permission codes.
 *
 *   <Can permission="candidate.list">...</Can>
 *   <Can anyOf={['evaluation.view_all', 'decision.final']}>...</Can>
 *   <Can allOf={['workflow.hr_review', 'decision.final']}>...</Can>
 *
 * Optional `fallback` renders when the user lacks the permission(s).
 */
const Can = ({ permission, anyOf, allOf, fallback = null, children }) => {
  const { permissions } = useAuth();

  let allowed = true;
  if (permission) {
    allowed = permissions.includes(permission);
  } else if (anyOf && anyOf.length) {
    allowed = anyOf.some((code) => permissions.includes(code));
  } else if (allOf && allOf.length) {
    allowed = allOf.every((code) => permissions.includes(code));
  }

  return allowed ? children : fallback;
};

export default Can;
