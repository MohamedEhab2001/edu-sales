import { Icon, type IconName } from "@/components/ui/icon";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span><Icon name={icon} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
